'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const moment = require('moment');
const { find } = require('lodash');

const uuid = require('uuid/v4');

const sandbox = sinon.createSandbox();

const services = require('../../../../../src/internal/lib/connectors/services');
const controller = require('../../../../../src/internal/modules/charge-information/controllers/non-chargeable');

const createRequest = () => ({
  params: {
    licenceId: 'test-licence-id'
  },
  view: {
    foo: 'bar',
    csrfToken: uuid()
  },
  query: {},
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123',
      startDate: moment().subtract(2, 'years').format('YYYY-MM-DD')
    },
    isChargeable: true,
    changeReasons: [{
      changeReasonId: 'test-reason-1',
      description: 'New licence'
    }, {
      changeReasonId: 'test-reason-2',
      description: 'Transfer'
    }],
    draftChargeInformation: {
      chargeElements: [],
      invoiceAccount: {
        invoiceAccountAddresses: []
      },
      dateRange: {}
    },
    defaultCharges: [
      { season: 'summer' }
    ],
    billingAccounts: [
      {
        id: 'test-licence-account-1',
        invoiceAccountAddresses: [],
        company: { name: 'Test company' }
      },
      {
        id: 'test-licence-account-2',
        company: { name: 'Test company' },
        invoiceAccountAddresses: []
      }
    ]
  },
  yar: {
    get: sandbox.stub()
  },
  setDraftChargeInformation: sandbox.stub(),
  clearDraftChargeInformation: sandbox.stub()
});

const getISODate = str => moment(str).format('YYYY-MM-DD');

experiment('internal/modules/charge-information/controller', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };

    sandbox.stub(services.crm.documents, 'getWaterLicence').resolves({
      document_id: 'test-doc-id'
    });
    sandbox.stub(services.water.chargeVersionWorkflows, 'postChargeVersionWorkflow').resolves();
    sandbox.stub(services.water.chargeVersionWorkflows, 'deleteChargeVersionWorkflow').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getNonChargeableReason', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getNonChargeableReason(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form.njk');
    });

    experiment('when the user has started the chargeable flow', () => {
      test('sets a back link to the chargeable reason page', async () => {
        request = createRequest();
        request.query.start = true;
        await controller.getNonChargeableReason(request, h);
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal('/licences/test-doc-id#charge');
      });
    });

    experiment('when the user has started the non chargeable flow', () => {
      test('sets a back link to the charge table on the licence page', async () => {
        request = createRequest();
        request.query.start = false;
        await controller.getNonChargeableReason(request, h);
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal('/licences/test-licence-id/charge-information/create');
      });
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Why is this licence not chargeable?');
    });

    test('has a caption', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has the expected form', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.form.action).to.equal('/licences/test-licence-id/charge-information/non-chargeable-reason');
      expect(view.form.method).to.equal('POST');
    });
  });

  experiment('.postNonChargeableReason', () => {
    experiment('when a valid reason is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          reason: 'test-reason-1'
        };
        await controller.postNonChargeableReason(request, h);
      });

      test('the draft charge information is updated with the reason', async () => {
        const [id, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(data.changeReason.changeReasonId).to.equal(request.payload.reason);
      });

      test('the user is redirected to the expected page', async () => {
        const [path] = h.redirect.lastCall.args;
        expect(path).to.equal('/licences/test-licence-id/charge-information/effective-date');
      });
    });

    experiment('when no reason is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken
        };
        await controller.postNonChargeableReason(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.setDraftChargeInformation.called).to.be.false();
      });

      test('the form in error state is passed to the post-redirect-get handler', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form.errors[0].message).to.equal('Select a reason');
      });
    });
  });

  experiment('when "licenceStartDate" is posted', () => {
    beforeEach(async () => {
      request = createRequest();
      request.pre.isChargeable = false;
      request.payload = {
        csrf_token: request.view.csrfToken,
        startDate: 'licenceStartDate'
      };
      await controller.postEffectiveDate(request, h);
    });

    test('the draft charge information is updated with the start date', async () => {
      const [id, data] = request.setDraftChargeInformation.lastCall.args;
      expect(id).to.equal('test-licence-id');
      expect(data.dateRange.startDate).to.equal(request.pre.licence.startDate);
    });

    test('the user is redirected to the check data page', async () => {
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/licences/test-licence-id/charge-information/check');
    });
  });

  experiment('when "customDate" is posted', () => {
    const customDate = moment().subtract(1, 'year');

    beforeEach(async () => {
      request = createRequest();
      request.pre.isChargeable = false;
      request.payload = {
        csrf_token: request.view.csrfToken,
        startDate: 'customDate',
        'customDate-day': customDate.format('DD'),
        'customDate-month': customDate.format('MM'),
        'customDate-year': customDate.format('YYYY')
      };
      await controller.postEffectiveDate(request, h);
    });

    test('the draft charge information is updated with the start date', async () => {
      const [id, data] = request.setDraftChargeInformation.lastCall.args;
      expect(id).to.equal('test-licence-id');
      expect(data.dateRange.startDate).to.equal(customDate.format('YYYY-MM-DD'));
    });

    test('the user is redirected to the check data page', async () => {
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/licences/test-licence-id/charge-information/check');
    });
  });

  experiment('when an invalid "customDate" is posted', () => {
    beforeEach(async () => {
      request = createRequest();
      request.pre.isChargeable = false;
      request.payload = {
        csrf_token: request.view.csrfToken,
        startDate: 'customDate',
        'customDate-day': 'Last',
        'customDate-month': 'Tuesday',
        'customDate-year': 'Or Wednesday'
      };
      await controller.postEffectiveDate(request, h);
    });

    test('the draft charge information is not updated', async () => {
      expect(request.setDraftChargeInformation.called).to.be.false();
    });

    test('an error is displayed', async () => {
      const [ form ] = h.postRedirectGet.lastCall.args;
      const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
      expect(field.errors[0].message).to.equal('Enter a real date for the effective date');
    });
  });

  experiment('when a custom date before the licence started is posted', () => {
    beforeEach(async () => {
      request = createRequest();
      request.pre.isChargeable = false;
      request.payload = {
        csrf_token: request.view.csrfToken,
        startDate: 'customDate',
        'customDate-day': '1',
        'customDate-month': '5',
        'customDate-year': '1966'
      };
      await controller.postEffectiveDate(request, h);
    });

    test('the draft charge information is not updated', async () => {
      expect(request.setDraftChargeInformation.called).to.be.false();
    });

    test('an error is displayed', async () => {
      const [ form ] = h.postRedirectGet.lastCall.args;
      const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
      expect(field.errors[0].message).to.equal('You must enter a date after the licence start date');
    });
  });

  experiment('when a custom date after the licence end date is posted', () => {
    beforeEach(async () => {
      const tomorrow = moment().add(1, 'day');

      request = createRequest();
      request.pre.isChargeable = false;
      request.pre.licence.endDate = getISODate();
      request.payload = {
        csrf_token: request.view.csrfToken,
        startDate: 'customDate',
        'customDate-day': tomorrow.format('DD'),
        'customDate-month': tomorrow.format('MM'),
        'customDate-year': tomorrow.format('YYYY')
      };
      await controller.postEffectiveDate(request, h);
    });

    test('the draft charge information is not updated', async () => {
      expect(request.setDraftChargeInformation.called).to.be.false();
    });

    test('an error is displayed', async () => {
      const [ form ] = h.postRedirectGet.lastCall.args;
      const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
      expect(field.errors[0].message).to.equal('You must enter a date before the licence end date');
    });
  });

  experiment('when a custom date more than 6 years ago is posted', () => {
    beforeEach(async () => {
      request = createRequest();
      request.pre.isChargeable = false;
      request.pre.licence.startDate = '1990-01-01';
      request.payload = {
        csrf_token: request.view.csrfToken,
        startDate: 'customDate',
        'customDate-day': '02',
        'customDate-month': '01',
        'customDate-year': '1990'
      };
      await controller.postEffectiveDate(request, h);
    });

    test('the draft charge information is not updated', async () => {
      expect(request.setDraftChargeInformation.called).to.be.false();
    });

    test('an error is displayed', async () => {
      const [ form ] = h.postRedirectGet.lastCall.args;
      const field = find(form.fields, { name: 'startDate' }).options.choices[1].fields[0];
      expect(field.errors[0].message).to.equal("Date must be today or up to six years' in the past");
    });
  });
});
