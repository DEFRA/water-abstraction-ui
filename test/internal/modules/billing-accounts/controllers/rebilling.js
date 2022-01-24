'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const { v4: uuid } = require('uuid');

const controller = require('internal/modules/billing-accounts/controllers/rebilling');
const services = require('internal/lib/connectors/services');

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
    }],
    rebillingState: {
      fromDate: '2019-01-01',
      selectedBillIds: ['test-bill-id-1']
    }
  },
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub(),
    clear: sandbox.stub()
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

    sandbox.stub(services.water.billingInvoices, 'patchFlagForRebilling');
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
      expect(field.options.hint).to.equal('We\'ll show all the bills created in the service on or after this date. This will not include zero value and de minimus bills.');
      expect(field.options.heading).to.be.true();
      expect(field.options.size).to.equal('l');
      expect(field.options.type).to.equal('date');
      expect(field.options.mapper).to.equal('dateMapper');
    });

    test('the date field has the correct error messages', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = findField(form, 'fromDate');
      expect(field.options.errors).to.equal({
        'any.required': { message: 'Enter the date you need to reissue a bill from' },
        'date.base': { message: 'Enter a real date' },
        'date.format': { message: 'Enter a real date' },
        'date.max': { message: 'There are no bills available for reissue for this date.  Enter a date on or before 1 January 2020.' }
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
        expect(errors[0].message).to.equal('Enter the date you need to reissue a bill from');
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
        expect(errors[0].message).to.equal('There are no bills available for reissue for this date.  Enter a date on or before 1 January 2020.');
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

      test('the state is stored in the session', async () => {
        const [key, state] = request.yar.set.lastCall.args;
        expect(key).to.equal(`rebilling.${billingAccountId}`);
        expect(state).to.equal({
          fromDate: '2019-01-01',
          selectedBillIds: ['test-bill-id-1']
        });
      });

      test('the user is redirected to the check answers page', async () => {
        expect(h.postRedirectGet.called).to.be.false();
        expect(h.redirect.calledWith(
          `/billing-accounts/${billingAccountId}/rebilling/check-answers`
        )).to.be.true();
      });
    });
  });

  experiment('.getCheckAnswers', () => {
    experiment('when there is 1 bill selected', () => {
      beforeEach(async () => {
        request = createRequest();
        await controller.getCheckAnswers(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/billing-accounts/rebilling-check-answers');
      });

      test('sets a back link', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(`/billing-accounts/${billingAccountId}/rebilling`);
      });

      test('sets a form', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
      });

      test('sets a page title', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('There is 1 bill available for reissue to Test Company');
      });

      test('sets a caption', async () => {
        const [, { caption }] = h.view.lastCall.args;
        expect(caption).to.equal(`Billing account ${accountNumber}`);
      });

      test('the form defines a csrf token field', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = findField(form, 'csrf_token');
        expect(field.value).to.equal(csrfToken);
      });

      test('the form defines a button', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = findButton(form);
        expect(field.options.label).to.equal('Confirm');
      });

      test('sets a links to change selected values', async () => {
        const [, { links }] = h.view.lastCall.args;
        expect(links.changeDate).to.equal(`/billing-accounts/${billingAccountId}/rebilling`);
        expect(links.selectBills).to.equal(`/billing-accounts/${billingAccountId}/rebilling/select-bills`);
      });

      test('sets the current billing account address', async () => {
        const [, { currentAddress }] = h.view.lastCall.args;
        expect(currentAddress).to.equal(request.pre.billingAccount.invoiceAccountAddresses[1]);
      });

      test('sets the billing account', async () => {
        const [, { billingAccount }] = h.view.lastCall.args;
        expect(billingAccount).to.equal(request.pre.billingAccount);
      });
    });

    experiment('when there are 2 or more bills selected', () => {
      beforeEach(async () => {
        request = createRequest();
        request.pre.rebillingState.selectedBillIds = ['test-bill-id-1', 'test-bill-id-1'];
        await controller.getCheckAnswers(request, h);
      });

      test('sets a plural page title', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('There are 2 bills available for reissue to Test Company');
      });
    });
  });

  experiment('.postCheckAnswers', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.postCheckAnswers(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing-accounts/rebilling-confirmation');
    });

    test('calls the API endpoint for each invoice selected', async () => {
      expect(services.water.billingInvoices.patchFlagForRebilling.callCount).to.equal(1);
      expect(services.water.billingInvoices.patchFlagForRebilling.calledWith(
        'test-bill-id-1'
      )).to.be.true();
    });

    test('clears the session storage', async () => [
      expect(request.yar.clear.calledWith(
        `rebilling.${billingAccountId}`
      )).to.be.true()
    ]);

    test('sets a page title', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('You’ve marked 1 bill for reissue');
    });

    test('sets a bill count', async () => {
      const [, { billCount }] = h.view.lastCall.args;
      expect(billCount).to.equal(1);
    });

    test('sets a list of bills affected', async () => {
      const [, { bills }] = h.view.lastCall.args;
      expect(bills).to.be.an.array().length(1);
    });
  });

  experiment('.getSelectBills', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getSelectBills(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('sets a back link', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`/billing-accounts/${billingAccountId}/check-answers`);
    });

    test('sets a form', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form).to.be.an.object();
    });

    test('sets a page title', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Select the bills you need to reissue');
    });

    test('the form defines a checkbox field', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = findField(form, 'selectedBillIds');
      expect(field.options.label).to.equal('Select the bills you need to reissue');
      expect(field.options.caption).to.equal(`Billing account ${accountNumber}`);
      expect(field.options.hint).to.equal('Bills created on or after 1 January 2019');
      expect(field.options.heading).to.be.true();
      expect(field.options.size).to.equal('l');
      expect(field.options.mapper).to.equal('arrayMapper');
      expect(field.options.widget).to.equal('checkbox');
    });

    test('the date field has the correct error messages', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = findField(form, 'selectedBillIds');
      expect(field.options.errors).to.equal({
        'array.min': { message: 'You need to select at least one bill to reissue' }
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

  experiment('.postSelectBills', () => {
    experiment('when no checkboxes are selected', () => {
      beforeEach(async () => {
        request = createRequest();
        request.method = 'post';
        request.payload = {
          csrf_token: csrfToken
        };
        await controller.postSelectBills(request, h);
      });

      test('the user is redirected to the form with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('the correct error message is set', async () => {
        const { errors } = h.postRedirectGet.lastCall.args[0];
        expect(errors[0].name).to.equal('selectedBillIds');
        expect(errors[0].message).to.equal('You need to select at least one bill to reissue');
      });
    });

    experiment('when checkboxes are selected', () => {
      beforeEach(async () => {
        request = createRequest();
        request.method = 'post';
        request.payload = {
          csrf_token: csrfToken,
          selectedBillIds: ['test-bill-id-1']
        };
        request.yar.get.returns({
          fromDate: '2019-01-01'
        });
        await controller.postSelectBills(request, h);
      });

      test('the user is not redirected to the form', async () => {
        expect(h.postRedirectGet.called).to.be.false();
      });

      test('the state is stored in the session', async () => {
        const [key, state] = request.yar.set.lastCall.args;
        expect(key).to.equal(`rebilling.${billingAccountId}`);
        expect(state).to.equal({
          fromDate: '2019-01-01',
          selectedBillIds: ['test-bill-id-1']
        });
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
