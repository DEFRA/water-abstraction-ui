'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid').v4;

const controller = require('internal/modules/billing-accounts/controllers/rebilling');

const billingAccountId = 'test-billing-account-id';
const accountNumber = 'A00000000A';
const csrfToken = uuid();

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  method: 'get',
  view: {
    csrfToken
  },
  params: {
    billingAccountId
  },
  payload: {
  },
  pre: {
    billingAccount: {
      id: 'test-billing-account-id',
      invoiceAccountAddresses: [{
        dateRange: {
          startDate: '2016-04-01',
          endDate: '2018-12-31'
        },
        address: {
          addressLine1: '1 Test',
          addressLine2: 'Address Lane',
          postcode: 'TT1 1TT'
        }
      }, {
        dateRange: {
          startDate: '2019-01-01',
          endDate: null
        },
        address: {
          addressLine1: '2 Test',
          addressLine2: 'Address Street',
          postcode: 'TT2 2TT'
        }
      }],
      dateRange: {
        startDate: '2019-01-01',
        endDate: null
      },
      accountNumber,
      company: {
        name: 'Test Company'
      }
    },
    rebillableBills: [{
      id: 'test-bill-id-1',
      invoiceNumber: '0001',
      dateCreated: '2020-01-01 15:33:21',
      batch: {
        dateCreated: '2020-01-01 15:33:21',
        type: 'supplementary'
      }
    }]
  },
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub()
  }
});

experiment('internal/modules/billing-accounts/controllers/rebilling', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
  });
  afterEach(async () => sandbox.restore());

  experiment('.getRebillingStartDate', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getRebillingStartDate(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('sets a back link', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`/billing-accounts/${billingAccountId}`);
    });

    test('sets a form', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form).to.be.an.object();
    });

    test('sets a page title', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('What date do you need to reissue a bill from?');
    });

    test('the form defines a date field', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = findField(form, 'fromDate');
      expect(field.options.label).to.equal('What date do you need to reissue a bill from?');
      expect(field.options.caption).to.equal(`Billing account ${accountNumber}`);
      expect(field.options.hint).to.equal(`We'll show all the bills created in the service on or after this date. This will not include zero value and de minimus bills.`);
      expect(field.options.heading).to.be.true();
      expect(field.options.size).to.equal('l');
      expect(field.options.type).to.equal('date');
      expect(field.options.mapper).to.equal('dateMapper');
    });

    test('the date field has the correct error messages', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = findField(form, 'fromDate');
      expect(field.options.errors).to.equal({
        'any.required': { message: 'Enter a date' },
        'date.isoDate': { message: 'Enter a real date' },
        'date.max': { message: 'Enter a date on or before 1 January 2020' }
      });
    });

    test('the form defines a csrf token field', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = findField(form, 'csrf_token');
      expect(field.value).to.equal(csrfToken);
    });

    test('the form defines a button', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = findButton(form);
      expect(field.options.label).to.equal('Continue');
    });
  });

  experiment('.postRebillingStartDate', () => {
    experiment('when no date is submitted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.method = 'post';
        request.payload = {
          csrf_token: csrfToken
        };
        await controller.postRebillingStartDate(request, h);
      });

      test('the user is redirected to the form with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('the correct error message is set', async () => {
        const { errors } = h.postRedirectGet.lastCall.args[0];
        expect(errors[0].name).to.equal('fromDate');
        expect(errors[0].message).to.equal('Enter a date');
      });
    });

    experiment('when an invalid date is submitted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.method = 'post';
        request.payload = {
          csrf_token: csrfToken,
          'fromDate-day': '32',
          'fromDate-month': '13',
          'fromDate-year': '2021'

        };
        await controller.postRebillingStartDate(request, h);
      });

      test('the user is redirected to the form with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('the correct error message is set', async () => {
        const { errors } = h.postRedirectGet.lastCall.args[0];
        expect(errors[0].name).to.equal('fromDate');
        expect(errors[0].message).to.equal('Enter a real date');
      });
    });

    experiment('when a date that is after the last valid bill date is submitted', () => {
      beforeEach(async () => {
        request = createRequest();
        request.method = 'post';
        request.payload = {
          csrf_token: csrfToken,
          'fromDate-day': '1',
          'fromDate-month': '1',
          'fromDate-year': '2022'
        };
        await controller.postRebillingStartDate(request, h);
      });

      test('the user is redirected to the form with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('the correct error message is set', async () => {
        const { errors } = h.postRedirectGet.lastCall.args[0];
        expect(errors[0].name).to.equal('fromDate');
        expect(errors[0].message).to.equal('Enter a date on or before 1 January 2020');
      });
    });

    experiment('when a valid date is supplied', () => {
      beforeEach(async () => {
        request = createRequest();
        request.method = 'post';
        request.payload = {
          csrf_token: csrfToken,
          'fromDate-day': '1',
          'fromDate-month': '1',
          'fromDate-year': '2019'
        };
        await controller.postRebillingStartDate(request, h);
      });

      test('the user is redirected to the check answers page', async () => {
        expect(h.postRedirectGet.called).to.be.false();
        expect(h.redirect.calledWith(
          `/billing-accounts/${billingAccountId}/rebilling/check-answers`
        )).to.be.true();
      });
    });
  });
});
