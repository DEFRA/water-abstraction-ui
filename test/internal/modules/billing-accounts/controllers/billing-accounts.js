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

const controller = require('internal/modules/billing-accounts/controllers/billing-accounts');

const addressChangeLink = '/test/link';

const createRequest = (query = {}) => ({
  view: {
    csrf_token: 'csrf-token'
  },
  params: {
    billingAccountId: 'test-billing-account-id'
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
      accountNumber: 'A12345678A',
      company: {
        name: 'Test Company'
      }
    },
    bills: {
      data: [{
        id: uuid()
      }],
      pagination: {
        page: 1,
        perPage: 10,
        totalRows: 30,
        pageCount: 3
      }
    },
    rebillableBills: [
      { test: 'test bill 1' },
      { test: 'test bill 2' }
    ]
  },
  query,
  billingAccountEntryRedirect: sandbox.stub().returns(addressChangeLink)
});

const h = {
  view: sandbox.stub()
};

experiment('internal/modules/billing-accounts/controllers/billing-accounts', () => {
  let request;

  afterEach(() => sandbox.restore());

  experiment('.getBillingAccount', () => {
    beforeEach(() => {
      request = createRequest();
      controller.getBillingAccount(request, h);
    });

    test('uses the correct template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing-accounts/view');
    });

    test('has the correct page title', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal(`Billing account for Test Company`);
    });

    test('has the correct caption', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.caption).to.equal('Billing account A12345678A');
    });

    test('has the current address', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.currentAddress).to.equal(request.pre.billingAccount.invoiceAccountAddresses[1]);
    });

    test('contains the billing account', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.billingAccount).to.equal(request.pre.billingAccount);
    });

    test('calls request.billingAccountEntryRedirect() with the correct params', () => {
      const [data] = request.billingAccountEntryRedirect.lastCall.args;
      expect(data.caption).to.equal(`Billing account ${request.pre.billingAccount.accountNumber}`);
      expect(data.key).to.equal(`change-address-${request.pre.billingAccount.id}`);
      expect(data.back).to.equal(`/billing-accounts/${request.pre.billingAccount.id}`);
      expect(data.redirectPath).to.equal(`/billing-accounts/${request.pre.billingAccount.id}`);
      expect(data.isUpdate).to.equal(true);

      const { id, company } = request.pre.billingAccount;
      expect(data.data).to.equal({ id, company });
    });

    test('has a change address link', () => {
      const [, { changeAddressLink }] = h.view.lastCall.args;
      expect(changeAddressLink).to.equal(addressChangeLink);
    });

    test('includes the bills', () => {
      const [, { bills }] = h.view.lastCall.args;
      expect(bills).to.equal(request.pre.bills.data);
    });

    test('includes a "more bills" link', () => {
      const { billingAccountId } = request.params;
      const [, { moreBillsLink }] = h.view.lastCall.args;
      expect(moreBillsLink).to.equal(`/billing-accounts/${billingAccountId}/bills`);
    });

    experiment('back link', () => {
      test('is undefined if one is not specified', () => {
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.be.undefined();
      });

      test('is included if one is specified', () => {
        request = createRequest({ back: '/back-link' });
        controller.getBillingAccount(request, h);
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.equal('/back-link');
      });
    });
  });

  experiment('.getBillingAccountBills', () => {
    beforeEach(() => {
      request = createRequest();
      controller.getBillingAccountBills(request, h);
    });

    test('uses the correct template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing-accounts/view-bills');
    });

    test('has the correct page title', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal(`Sent bills for Test Company`);
    });

    test('has the correct caption', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.caption).to.equal('Billing account A12345678A');
    });

    test('includes the bills', () => {
      const [, { bills }] = h.view.lastCall.args;
      expect(bills).to.equal(request.pre.bills.data);
    });

    test('includes the pagination object', () => {
      const [, { pagination }] = h.view.lastCall.args;
      expect(pagination).to.equal(request.pre.bills.pagination);
    });

    test('includes a back link', () => {
      const { billingAccountId } = request.params;
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`/billing-accounts/${billingAccountId}`);
    });
  });
});
