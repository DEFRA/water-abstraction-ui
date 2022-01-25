'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const { find } = require('lodash');
const moment = require('moment');

const uuid = require('uuid/v4');

const sandbox = sinon.createSandbox();

const services = require('../../../../../src/internal/lib/connectors/services');
const controller = require('../../../../../src/internal/modules/charge-information/controllers/charge-information');

const address = {
  addressLine1: '98 The new road',
  addressLine2: 'At the top',
  addressLine3: 'Down below',
  addressLine4: 'Middleshire',
  town: 'Newton Blah',
  postcode: 'NB1 2AA',
  country: 'United Kingdom'
};

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
      startDate: moment().subtract(2, 'years').format('YYYY-MM-DD'),
      region: { id: 'test-region-id' }
    },
    isChargeable: true,
    changeReasons: [{
      id: 'test-reason-1',
      description: 'New licence',
      isEnabledForNewChargeVersions: true
    }, {
      id: 'test-reason-2',
      description: 'Transfer',
      isEnabledForNewChargeVersions: true
    }],
    draftChargeInformation: {
      chargeElements: [],
      chargeCategories: [],
      invoiceAccount: {
        invoiceAccountAddresses: []
      },
      status: 'draft',
      dateRange: {}
    },
    defaultCharges: [
      { season: 'summer' }
    ],
    billingAccounts: [
      {
        id: 'test-licence-account-1',
        accountNumber: 'A12345678A',
        company: { name: 'Test company' },
        invoiceAccountAddresses: [{
          id: 'test-invoice-account-address-1',
          address
        }]
      },
      {
        id: 'test-licence-account-2',
        accountNumber: 'A12345678B',
        company: { name: 'Test company' },
        invoiceAccountAddresses: [{
          id: 'test-invoice-account-address-2',
          address
        }]
      }
    ],
    billingAccount: {
      id: 'test-licence-account-1',
      accountNumber: 'A12345678A',
      company: { name: 'Test company' },
      invoiceAccountAddresses: [{
        id: 'test-invoice-account-address-1',
        address,
        dateRange: {
          startDate: '2020-01-01',
          endDate: null
        }
      }]
    },
    chargeVersions: [
      { id: 'test-cv-id-1', dateRange: { startDate: '2010-04-20' }, status: 'superseded', chargeElements: [{ source: 'unsupported' }] },
      { id: 'test-cv-id-2', dateRange: { startDate: '2015-04-20' }, status: 'current', chargeElements: [{ source: 'tidal' }] }
    ]
  },
  yar: {
    get: sandbox.stub()
  },
  setDraftChargeInformation: sandbox.stub(),
  getDraftChargeInformation: sandbox.stub().returns({ dateRange: { startDate: '2019-01-01' } }),
  clearDraftChargeInformation: sandbox.stub(),
  billingAccountEntryRedirect: sandbox.stub(),
  getBillingAccount: sandbox.stub().returns({ id: 'test-billing-account-id' }),
  defra: { user: { user_id: 19, user_name: 'test@test.test' } }
});

const getReadableDate = str => moment(str).format('D MMMM YYYY');
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
    sandbox.stub(services.water.chargeVersionWorkflows, 'patchChargeVersionWorkflow').resolves();
    sandbox.stub(services.crm.documentRoles, 'getDocumentRolesByDocumentRef').resolves({ data: [] });
    sandbox.stub(services.crm.documentRoles, 'getFullHistoryOfDocumentRolesByDocumentRef').resolves({ data: [{
      companyId: 'some-company-id'
    }] });
    sandbox.stub(services.water.chargeVersions, 'getChargeVersionsByLicenceId').resolves({ data: [] });
    sandbox.stub(services.water.licences, 'getValidDocumentByLicenceIdAndDate').resolves({
      roles: [
        {
          id: 'test-role-id',
          roleName: 'licenceHolder',
          dateRange: {
            startDate: '2021-02-17',
            endDate: null
          },
          company: {
            name: 'Test UK Ltd',
            type: 'person',
            id: 'test-company-id'
          } }
      ]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReason', () => {
    beforeEach(async () => {
      request = createRequest();
      request.query = { isChargeable: true };
      await controller.getReason(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form.njk');
    });

    test('sets a back link', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/licences/test-licence-id#charge');
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Select reason for new charge information');
    });

    test('has a caption', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has a form', async () => {
      const { form } = h.view.lastCall.args[1];
      expect(form).to.be.an.object();
    });

    test('the form action is correct', async () => {
      const { form } = h.view.lastCall.args[1];
      expect(form.action).to.equal('/licences/test-licence-id/charge-information/create');
    });

    test('the form has a hidden CSRF field', async () => {
      const { form } = h.view.lastCall.args[1];
      const field = find(form.fields, { name: 'csrf_token' });
      expect(field.value).to.equal(request.view.csrfToken);
      expect(field.options.type).to.equal('hidden');
    });

    test('the form has a radio field for the change reasons', async () => {
      const { form } = h.view.lastCall.args[1];
      const field = find(form.fields, { name: 'reason' });
      expect(field.options.widget).to.equal('radio');
      expect(field.options.choices).to.be.an.array();
      expect(field.options.choices[0].label).to.equal('New licence');
      expect(field.options.choices[0].value).to.equal('test-reason-1');
      expect(field.options.choices[1].label).to.equal('Transfer');
      expect(field.options.choices[1].value).to.equal('test-reason-2');
      expect(field.value).to.be.undefined();
    });

    test('the form has a continue button', async () => {
      const { form } = h.view.lastCall.args[1];
      const field = find(form.fields, field => field.options.widget === 'button');
      expect(field.options.label).to.equal('Continue');
    });

    experiment('when a reason is set in the charge information', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.draftChargeInformation.changeReason = {
          id: 'test-reason-1'
        };
        await controller.getReason(request, h);
      });

      test('the radio field is selected', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'reason' });
        expect(field.value).to.equal('test-reason-1');
      });
    });
  });

  experiment('.postReason', () => {
    experiment('when a valid reason is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          reason: 'test-reason-1'
        };
        await controller.postReason(request, h);
      });

      test('the draft charge information is updated with the reason', async () => {
        const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(cvWorkflowId).to.equal(undefined);
        expect(data.changeReason.id).to.equal(request.payload.reason);
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/start-date'
        )).to.be.true();
      });
    });

    experiment('when a charge version workflow id query param is included', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          reason: 'test-reason-1'
        };
        request.query = {
          chargeVersionWorkflowId: uuid()
        };
        await controller.postReason(request, h);
      });

      test('the charge version workflow id is used to update the session data', async () => {
        const [, cvWorkflowId] = request.setDraftChargeInformation.lastCall.args;
        expect(cvWorkflowId).to.equal(request.query.chargeVersionWorkflowId);
      });
    });

    experiment('when a non-chargeable reason is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          reason: 'non-chargeable'
        };
        request.query = { isChargeable: true };
        await controller.postReason(request, h);
      });

      test('the draft charge information is cleared', async () => {
        const [id] = request.clearDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/non-chargeable-reason'
        )).to.be.true();
      });
    });

    experiment('when no reason is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken
        };
        request.query = { isChargeable: true };
        await controller.postReason(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.setDraftChargeInformation.called).to.be.false();
      });

      test('the form in error state is passed to the post-redirect-get handler', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form.errors[0].message).to.equal('Select a reason for new charge information');
      });
    });
  });

  experiment('.getStartDate', () => {
    experiment('when the licence start date is in the past 6 years', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.licence.startDate = moment().subtract(2, 'years').format('YYYY-MM-DD');
        await controller.getStartDate(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });

      test('sets a back link', async () => {
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal('/licences/test-licence-id/charge-information/create');
      });

      test('has the page title', async () => {
        const { pageTitle } = h.view.lastCall.args[1];
        expect(pageTitle).to.equal('Set charge start date');
      });

      test('has a caption', async () => {
        const { caption } = h.view.lastCall.args[1];
        expect(caption).to.equal('Licence 01/123');
      });

      test('passes through request.view', async () => {
        const { foo } = h.view.lastCall.args[1];
        expect(foo).to.equal(request.view.foo);
      });

      test('has a form', async () => {
        const { form } = h.view.lastCall.args[1];
        expect(form).to.be.an.object();
      });

      test('the form action is correct', async () => {
        const { form } = h.view.lastCall.args[1];
        expect(form.action).to.equal('/licences/test-licence-id/charge-information/start-date');
      });

      test('the form has a hidden CSRF field', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'csrf_token' });
        expect(field.value).to.equal(request.view.csrfToken);
        expect(field.options.type).to.equal('hidden');
      });

      test('the form has a radio fields for today, licence start date and custom date', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.options.widget).to.equal('radio');
        expect(field.options.choices).to.be.an.array();

        // Today
        expect(field.options.choices[0].label).to.equal('Today');
        expect(field.options.choices[0].value).to.equal('today');
        expect(field.options.choices[0].hint).to.equal(getReadableDate());

        // Licence start date
        expect(field.options.choices[1].label).to.equal('Licence start date');
        expect(field.options.choices[1].value).to.equal('licenceStartDate');
        expect(field.options.choices[1].hint).to.equal(getReadableDate(request.pre.licence.startDate));

        // Or divider
        expect(field.options.choices[2].divider).to.equal('or');

        // Custom date
        expect(field.options.choices[3].label).to.equal('Another date');
        expect(field.options.choices[3].value).to.equal('customDate');

        expect(field.value).to.be.undefined();
      });

      test('has a conditional field for a custom date', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
        expect(field.options.widget).to.equal('date');
        expect(field.options.label).to.equal('Start date');
        expect(field.value).to.be.undefined();
      });

      test('the form has a continue button', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, field => field.options.widget === 'button');
        expect(field.options.label).to.equal('Continue');
      });
    });

    experiment('when the licence start date is > 6 years in the past', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.licence.startDate = '1990-01-01';
        await controller.getStartDate(request, h);
      });

      test('the form has a radio fields for today, and custom date', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.options.widget).to.equal('radio');
        expect(field.options.choices).to.be.an.array();

        // Today
        expect(field.options.choices[0].label).to.equal('Today');
        expect(field.options.choices[0].value).to.equal('today');
        expect(field.options.choices[0].hint).to.equal(getReadableDate());

        // Custom date
        expect(field.options.choices[1].label).to.equal('Another date');
        expect(field.options.choices[1].value).to.equal('customDate');

        expect(field.value).to.be.undefined();
      });
    });

    experiment("when the a start date has already been set to today's date", () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.draftChargeInformation.dateRange.startDate = getISODate();
        await controller.getStartDate(request, h);
      });

      test('the "today" radio option is selected"', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.value).to.equal('today');
      });
    });

    experiment('when the a start date has already been set to the licence start date', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.draftChargeInformation.dateRange.startDate = request.pre.licence.startDate;
        await controller.getStartDate(request, h);
      });

      test('the "today" radio option is selected"', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.value).to.equal('licenceStartDate');
      });
    });

    experiment('when the a start date has already been set to a custom date', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.draftChargeInformation.dateRange.startDate = moment().subtract(1, 'years').format('YYYY-MM-DD');
        await controller.getStartDate(request, h);
      });

      test('the "today" radio option is selected"', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' });
        expect(field.value).to.equal('customDate');
      });

      test('the conditional field for custom date has a value', async () => {
        const { form } = h.view.lastCall.args[1];
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
        expect(field.value).to.equal(request.pre.draftChargeInformation.dateRange.startDate);
      });
    });
  });

  experiment('.postStartDate', () => {
    experiment('when "today" is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'today'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is updated with the start date', async () => {
        const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(cvWorkflowId).to.equal(undefined);
        expect(data.dateRange.startDate).to.equal(getISODate());
      });

      test('the user is redirected to the billing account page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/billing-account'
        )).to.be.true();
      });
    });

    experiment('when charge version workflow id is included as a query param', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'today'
        };
        request.query = { chargeVersionWorkflowId: uuid() };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is updated using the workflow id in the key', async () => {
        const [, cvWorkflowId] = request.setDraftChargeInformation.lastCall.args;
        expect(cvWorkflowId).to.equal(request.query.chargeVersionWorkflowId);
      });
    });

    experiment('when "licenceStartDate" is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'licenceStartDate'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is updated with the start date', async () => {
        const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(cvWorkflowId).to.equal(undefined);
        expect(data.dateRange.startDate).to.equal(request.pre.licence.startDate);
      });

      test('the user is redirected to the billing account page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/billing-account'
        )).to.be.true();
      });
    });

    experiment('when "customDate" is posted', () => {
      const customDate = moment().subtract(1, 'year');

      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': customDate.format('DD'),
          'customDate-month': customDate.format('MM'),
          'customDate-year': customDate.format('YYYY')
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is updated with the start date', async () => {
        const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(cvWorkflowId).to.equal(undefined);
        expect(data.dateRange.startDate).to.equal(customDate.format('YYYY-MM-DD'));
      });

      test('the user is redirected to the billing account page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/billing-account'
        )).to.be.true();
      });
    });

    experiment('when an invalid "customDate" is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': 'Last',
          'customDate-month': 'Tuesday',
          'customDate-year': 'Or Wednesday'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.setDraftChargeInformation.called).to.be.false();
      });

      test('an error is displayed', async () => {
        const [ form ] = h.postRedirectGet.lastCall.args;
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
        expect(field.errors[0].message).to.equal('Enter a real date for the charge information start date');
      });
    });

    experiment('when a custom date before the licence started is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': '1',
          'customDate-month': '5',
          'customDate-year': '1966'
        };
        await controller.postStartDate(request, h);
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
        request.pre.licence.endDate = getISODate();
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': tomorrow.format('DD'),
          'customDate-month': tomorrow.format('MM'),
          'customDate-year': tomorrow.format('YYYY')
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.setDraftChargeInformation.called).to.be.false();
      });

      test('an error is displayed', async () => {
        const [ form ] = h.postRedirectGet.lastCall.args;
        const field = find(form.fields, { name: 'startDate' }).options.choices[2].fields[0];
        expect(field.errors[0].message).to.equal('You must enter a date before the licence end date');
      });
    });

    experiment('when a custom date more than 6 years ago is posted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.licence.startDate = '1990-01-01';
        request.payload = {
          csrf_token: request.view.csrfToken,
          startDate: 'customDate',
          'customDate-day': '02',
          'customDate-month': '01',
          'customDate-year': '1990'
        };
        await controller.postStartDate(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.setDraftChargeInformation.called).to.be.false();
      });

      test('an error is displayed', async () => {
        const [ form ] = h.postRedirectGet.lastCall.args;
        const field = find(form.fields, { name: 'startDate' }).options.choices[1].fields[0];
        expect(field.errors[0].message).to.equal("Date must be today or up to five years' in the past");
      });
    });
  });

  experiment('.getBillingAccount', () => {
    beforeEach(async () => {
      services.crm.documentRoles.getFullHistoryOfDocumentRolesByDocumentRef.resolves({ data: [{
        companyId: 'some-company-id',
        roleName: 'licenceHolder'
      }] });
      request = createRequest();
      request.query = { chargeVersionWorkflowId: 'test-cv-workflow-id' };
      await controller.getBillingAccount(request, h);
    });

    test('gets the draft charge info using the charge version workflow id', async () => {
      const [id, cvWorkflowId] = request.getDraftChargeInformation.lastCall.args;
      expect(id).to.equal(request.params.licenceId);
      expect(cvWorkflowId).to.equal(request.query.chargeVersionWorkflowId);
    });

    test('maps the correct data for the billing account plugin', async () => {
      const args = request.billingAccountEntryRedirect.lastCall.args[0];
      expect(args.back).to.equal('/licences/test-licence-id/charge-information/start-date');
      expect(args.caption).to.equal('Licence 01/123');
      expect(args.key).to.equal('charge-information-test-licence-id-test-cv-workflow-id');
      expect(args.redirectPath).to.equal('/licences/test-licence-id/charge-information/set-billing-account?returnToCheckData=false&chargeVersionWorkflowId=test-cv-workflow-id');
    });
  });

  experiment('.getHandleBillingAccount', () => {
    beforeEach(async () => {
      request = createRequest();
      request.query = { chargeVersionWorkflowId: 'test-cv-workflow-id' };
      await controller.getHandleBillingAccount(request, h);
    });

    test('adds the correct billing account id to the draft charge data', async () => {
      const [licenceId, workflowId, chargeData] = request.setDraftChargeInformation.lastCall.args;
      expect(licenceId).to.equal('test-licence-id');
      expect(workflowId).to.equal('test-cv-workflow-id');
      expect(chargeData.invoiceAccount).to.equal({ id: 'test-billing-account-id' });
    });

    test('redirects to the correct page', async () => {
      const redirectPath = '/licences/test-licence-id/charge-information/use-abstraction-data?chargeVersionWorkflowId=test-cv-workflow-id';
      expect(h.redirect.lastCall.args[0]).to.equal(redirectPath);
    });

    test('does not redirect to the review page when returnToCheckData is not set', async () => {
      request = createRequest();
      request.query = { returnToCheckData: undefined };
      await controller.getHandleBillingAccount(request, h);
      const redirectPath = '/licences/test-licence-id/charge-information/use-abstraction-data';
      expect(h.redirect.lastCall.args[0]).to.equal(redirectPath);
    });

    test('does not redirect to the review page when status is not review', async () => {
      request = createRequest();
      request.query = { returnToCheckData: true };
      request.draftChargeInfomration = {
        status: 'foo'
      };
      await controller.getHandleBillingAccount(request, h);
      const redirectPath = '/licences/test-licence-id/charge-information/check';
      expect(h.redirect.lastCall.args[0]).to.equal(redirectPath);
    });

    test('redirects to the review page when status is review', async () => {
      request = createRequest();
      request.query = {
        returnToCheckData: true,
        chargeVersionWorkflowId: 'test-workflow-id'
      };
      request.pre.draftChargeInformation = {
        status: 'review'
      };
      await controller.getHandleBillingAccount(request, h);
      const redirectPath = '/licences/test-licence-id/charge-information/test-workflow-id/review';
      expect(h.redirect.lastCall.args[0]).to.equal(redirectPath);
    });
  });

  experiment('.getUseAbstractionData', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getUseAbstractionData(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form.njk');
    });

    test('sets a back link', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/licences/test-licence-id/charge-information/billing-account');
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Use abstraction data to set up the element?');
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
      expect(view.form.action).to.equal('/licences/test-licence-id/charge-information/use-abstraction-data');
      expect(view.form.method).to.equal('POST');
    });
  });

  experiment('.postUseAbstractionData', () => {
    experiment('when a valid option is selected', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          useAbstractionData: 'yes'
        };
        await controller.postUseAbstractionData(request, h);
      });

      test('the draft charge information is updated with the abstraction data', async () => {
        const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(cvWorkflowId).to.equal(undefined);
        expect(data.chargeElements[0]).to.contain(request.pre.defaultCharges[0]);
        expect(data.chargeElements[0]).to.include('id');
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/check'
        )).to.be.true();
      });
    });

    experiment('when a valid option is selected and the charge version workflow id is included as a query param', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          useAbstractionData: 'yes'
        };
        request.query = { chargeVersionWorkflowId: 'test-workflow-id' };
        await controller.postUseAbstractionData(request, h);
      });

      test('the draft charge information is updated with the abstraction data', async () => {
        const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(cvWorkflowId).to.equal('test-workflow-id');
        expect(data.chargeElements[0]).to.contain(request.pre.defaultCharges[0]);
        expect(data.chargeElements[0]).to.include('id');
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/check?chargeVersionWorkflowId=test-workflow-id'
        )).to.be.true();
      });
    });

    experiment('when a an existing charge version option is selected', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          useAbstractionData: 'test-cv-id-2'
        };
        await controller.postUseAbstractionData(request, h);
      });

      test('the draft charge information is updated with the charge version data', async () => {
        const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(cvWorkflowId).to.equal(undefined);
        expect(data.chargeElements[0].source).to.equal(request.pre.chargeVersions[1].chargeElements[0].source);
        const guidRegex = /^[a-z,0-9]{8}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{4}-[a-z,0-9]{12}$/;
        expect(data.chargeElements[0].id).to.match(guidRegex);
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/check'
        )).to.be.true();
      });
    });

    experiment('when no option is selected', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken
        };
        await controller.postUseAbstractionData(request, h);
      });

      test('the draft charge information is not updated', async () => {
        expect(request.setDraftChargeInformation.called).to.be.false();
      });

      test('the form in error state is passed to the post-redirect-get handler', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form.errors[0].message).to.equal('Select whether to use abstraction data to set up the element');
      });
    });
  });

  experiment('.getCheckData', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getCheckData(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/charge-information/view.njk');
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Check charge information');
    });

    test('has a caption', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });
  });

  experiment('.getCheckData when a workflow id is included', () => {
    beforeEach(async () => {
      request = createRequest();
      request.query = { chargeVersionWorkflowId: 'test-workflow-id' };
      await controller.getCheckData(request, h);
    });

    test('adds the correct charge version workflow id to the view', async () => {
      expect(h.view.lastCall.args[1].chargeVersionWorkflowId).to.equal(request.query.chargeVersionWorkflowId);
    });
  });

  experiment('.postCheckData', () => {
    experiment('when a the user confirms the charge info', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          buttonAction: 'confirm'
        };
        await controller.postCheckData(request, h);
      });

      test('the data is submitted in the expected format', async () => {
        const [{ licenceId, chargeVersion }] = services.water.chargeVersionWorkflows.postChargeVersionWorkflow.lastCall.args;
        expect(licenceId).to.equal(request.params.licenceId);
        expect(chargeVersion).to.equal(request.pre.draftChargeInformation);
      });

      test('the session data is cleared', async () => {
        const [licenceId] = request.clearDraftChargeInformation.lastCall.args;
        expect(licenceId).to.equal(request.params.licenceId);
      });

      test('the user is redirected to the confirmation page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/submitted?chargeable=true'
        )).to.be.true();
      });
    });

    experiment('when a the user confirms the charge info for a charge version workflow', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          buttonAction: 'confirm'
        };
        request.query = { chargeVersionWorkflowId: 'test-workflow-id' };
        await controller.postCheckData(request, h);
      });

      test('the data is submitted in the expected format', async () => {
        const [workflowId, patchObject] = services.water.chargeVersionWorkflows.patchChargeVersionWorkflow.lastCall.args;
        expect(workflowId).to.equal('test-workflow-id');
        expect(patchObject.status).to.equal('review');
        expect(patchObject.approverComments).to.equal(null);
        expect(patchObject.chargeVersion).to.equal(request.pre.draftChargeInformation);
        expect(patchObject.createdBy).to.equal({ id: 19, email: 'test@test.test' });
      });

      test('the session data is cleared', async () => {
        const [licenceId] = request.clearDraftChargeInformation.lastCall.args;
        expect(licenceId).to.equal(request.params.licenceId);
      });

      test('the user is redirected to the confirmation page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/submitted?chargeable=true'
        )).to.be.true();
      });
    });

    experiment('when a the user cancels the flow', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          buttonAction: 'cancel'
        };
        await controller.postCheckData(request, h);
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/cancel'
        )).to.be.true();
      });
    });

    experiment('when a the user adds an element to the charge info', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          buttonAction: 'addElement'
        };
        await controller.postCheckData(request, h);
      });

      test('the user is redirected to the expected page', async () => {
        const [redirectPath] = h.redirect.lastCall.args;
        // random guid is assigned as the new element id
        expect(redirectPath).to.startWith('/licences/test-licence-id/charge-information/charge-element');
        expect(redirectPath).to.endWith('/purpose');
      });
    });

    experiment('when a the user removes an element to the charge info', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          buttonAction: 'removeElement:test-element-1-id'
        };
        request.pre.draftChargeInformation.chargeElements.push(...[{
          id: 'test-element-1-id'
        }, {
          id: 'test-element-2-id'
        }]);
        await controller.postCheckData(request, h);
      });

      test('the session data is saved excluding charge element to remove', async () => {
        const [,, data] = request.setDraftChargeInformation.lastCall.args;
        expect(data.chargeElements).to.equal([{
          id: 'test-element-2-id'
        }]);
      });

      test('the user is redirected to the confirmation page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/check'
        )).to.be.true();
      });
    });
  });

  experiment('.getCancelData', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getCancelData(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/charge-information/cancel.njk');
    });

    test('sets a back link', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/licences/test-licence-id/charge-information/check');
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('You\'re about to cancel this charge information');
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
      expect(view.form.action).to.equal('/licences/test-licence-id/charge-information/cancel');
      expect(view.form.method).to.equal('POST');
    });
  });

  experiment('.postCancelData', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.postCancelData(request, h);
    });

    experiment('when a charge version workflow does not exist', () => {
      test('does not delete the charge version workflow', () => {
        expect(
          services.water.chargeVersionWorkflows.deleteChargeVersionWorkflow.called
        ).to.be.false();
      });

      test('the draft charge info is deleted from the session', () => {
        const [id] = request.clearDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id#charge'
        )).to.be.true();
      });
    });

    experiment('when a charge version workflow exists', () => {
      beforeEach(async () => {
        request.query.chargeVersionWorkflowId = 'test-workflow-id';
        await controller.postCancelData(request, h);
      });

      test('deletes the charge version workflow', () => {
        const [id] = services.water.chargeVersionWorkflows.deleteChargeVersionWorkflow.lastCall.args;
        expect(id).to.equal('test-workflow-id');
      });

      test('the draft charge info is deleted from the session', () => {
        const [id] = request.clearDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id#charge'
        )).to.be.true();
      });
    });
  });

  experiment('.getSubmitted', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getSubmitted(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/charge-information/submitted.njk');
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Charge information complete');
    });

    test('has a caption', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });
  });
});
