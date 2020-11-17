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
const queryString = require('querystring');

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
      description: 'New licence'
    }, {
      id: 'test-reason-2',
      description: 'Transfer'
    }],
    draftChargeInformation: {
      chargeElements: [],
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
    chargeVersions: []
  },
  yar: {
    get: sandbox.stub()
  },
  setDraftChargeInformation: sandbox.stub(),
  clearDraftChargeInformation: sandbox.stub()
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
    sandbox.stub(services.water.chargeVersions, 'getChargeVersionsByLicenceId').resolves({ data: [] });
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
      expect(back).to.equal('/licences/test-doc-id#charge');
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
        const [id, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(data.changeReason.id).to.equal(request.payload.reason);
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/start-date'
        )).to.be.true();
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
        const [id, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(data.dateRange.startDate).to.equal(getISODate());
      });

      test('the user is redirected to the billing account page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/billing-account'
        )).to.be.true();
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
        const [id, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
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
        const [id, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
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
        const field = find(form.fields, { name: 'startDate' }).options.choices[3].fields[0];
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
        expect(field.errors[0].message).to.equal("Date must be today or up to six years' in the past");
      });
    });
  });

  experiment('.getSelectBillingAccount', () => {
    experiment('when there are no billing accounts for the licence', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.billingAccounts = [];
        request.pre.licenceHolderRole = {
          company: { id: 'test-company-id' }
        };
        await controller.getSelectBillingAccount(request, h);
      });

      test('the user is redirects to new billing account page', async () => {
        const [url] = h.redirect.lastCall.args;
        const expectedQueryString = queryString.stringify({
          redirectPath: '/licences/test-licence-id/charge-information/use-abstraction-data',
          licenceId: 'test-licence-id'
        });
        expect(url).to.equal(`/invoice-accounts/create/test-region-id/test-company-id?${expectedQueryString}`);
      });
    });

    experiment('when there are no billing accounts for the licence', () => {
      beforeEach(async () => {
        request = createRequest();
        await controller.getSelectBillingAccount(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });

      test('sets a back link', async () => {
        const { back } = h.view.lastCall.args[1];
        expect(back).to.equal('/licences/test-licence-id/charge-information/start-date');
      });

      test('sets a page title including the company name', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.pageTitle).to.equal('Select an existing billing account for Test company');
      });

      test('has the expected form', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.form.action).to.equal('/licences/test-licence-id/charge-information/billing-account');
        expect(view.form.method).to.equal('POST');
      });
    });
  });

  experiment('.postSelectBillingAccount', () => {
    experiment('when the user chooses to set up a new billing account', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          invoiceAccountAddress: 'set-up-new-billing-account'
        };
        request.pre.licenceHolderRole = {
          company: { id: 'test-company-id' }
        };
        await controller.postSelectBillingAccount(request, h);
      });

      test('the user is redirected to the expected page', async () => {
        const expectedQueryString = queryString.stringify({
          redirectPath: '/licences/test-licence-id/charge-information/use-abstraction-data',
          licenceId: 'test-licence-id'
        });
        expect(h.redirect.calledWith(
          `/invoice-accounts/create/test-region-id/test-company-id?${expectedQueryString}`
        )).to.be.true();
      });
    });

    experiment('when the user chooses an existing billing account', () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload = {
          csrf_token: request.view.csrfToken,
          invoiceAccountAddress: 'test-invoice-account-address-2'
        };
        await controller.postSelectBillingAccount(request, h);
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-licence-id/charge-information/use-abstraction-data'
        )).to.be.true();
      });
    });

    experiment('when changing billing account from check charge info page', () => {
      experiment('and the user chooses an existing billing account', () => {
        beforeEach(async () => {
          request = createRequest();
          request.payload = {
            csrf_token: request.view.csrfToken,
            invoiceAccountAddress: 'test-invoice-account-address-2'
          };
          request.query = { returnToCheckData: 1 };
          await controller.postSelectBillingAccount(request, h);
        });

        test('the user is redirected to the expected page', async () => {
          expect(h.redirect.calledWith(
            '/licences/test-licence-id/charge-information/check'
          )).to.be.true();
        });
      });

      experiment('and the user chooses to set up a new billing account', () => {
        beforeEach(async () => {
          request = createRequest();
          request.payload = {
            csrf_token: request.view.csrfToken,
            invoiceAccountAddress: 'set-up-new-billing-account'
          };
          request.pre.licenceHolderRole = {
            company: { id: 'test-company-id' }
          };
          request.query = { returnToCheckData: 1 };
          await controller.postSelectBillingAccount(request, h);
        });

        test('the user is redirected to the expected page', async () => {
          const expectedQueryString = queryString.stringify({
            redirectPath: '/licences/test-licence-id/charge-information/check',
            licenceId: 'test-licence-id'
          });
          expect(h.redirect.calledWith(
            `/invoice-accounts/create/test-region-id/test-company-id?${expectedQueryString}`
          )).to.be.true();
        });
      });
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
        const [id, data] = request.setDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
        expect(data.chargeElements[0]).to.contain(request.pre.defaultCharges[0]);
        expect(data.chargeElements[0]).to.include('id');
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

    test('sets a back link', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/licences/test-licence-id/charge-information/use-abstraction-data');
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
        const [, data] = request.setDraftChargeInformation.lastCall.args;
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
          '/licences/test-doc-id#charge'
        )).to.be.true();
      });
    });

    experiment('when a charge version workflow exists', () => {
      beforeEach(async () => {
        request.pre.draftChargeInformation.chargeVersionWorkflowId = 'test-workflow-id';
        await controller.postCancelData(request, h);
      });

      test('does not delete the charge version workflow', () => {
        const [id] = services.water.chargeVersionWorkflows.deleteChargeVersionWorkflow.lastCall.args;
        expect(id).to.equal('test-workflow-id');
      });

      test('the draft charge info is deleted from the session', () => {
        const [id] = request.clearDraftChargeInformation.lastCall.args;
        expect(id).to.equal('test-licence-id');
      });

      test('the user is redirected to the expected page', async () => {
        expect(h.redirect.calledWith(
          '/licences/test-doc-id#charge'
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
