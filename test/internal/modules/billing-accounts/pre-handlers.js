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
const services = require('internal/lib/connectors/services');
const preHandlers = require('internal/modules/billing-accounts/pre-handlers');
const session = require('internal/modules/billing-accounts/lib/session');
const { logger } = require('internal/logger');

const createError = code => {
  const error = new Error('oops');
  error.statusCode = code;
  return error;
};

const KEY = 'test-key';
const COMPANY_ID = 'test-company-id';
const REGION_ID = 'test-region-id';
const BILLING_ACCOUNT_ID = 'test-billing-account-id';

experiment('internal/modules/billing-accounts/pre-handlers', () => {
  let request, response;

  beforeEach(() => {
    request = {
      params: {
        billingAccountId: BILLING_ACCOUNT_ID,
        key: KEY
      }
    };

    sandbox.stub(services.water.invoiceAccounts, 'getInvoiceAccount').resolves({
      id: 'test-billing-account-id',
      company: {
        name: 'test-company'
      }
    });
    sandbox.stub(services.water.invoiceAccounts, 'getLicences');
    sandbox.stub(services.water.invoiceAccounts, 'getInvoiceAccountInvoices');
    sandbox.stub(services.water.companies, 'getCompanyInvoiceAccounts');
    sandbox.stub(services.water.companies, 'getCompany');
    sandbox.stub(session, 'get');
    sandbox.stub(logger, 'error');
  });

  afterEach(() => sandbox.restore());

  experiment('.loadBillingAccount', () => {
    beforeEach(async () => {
      request = {
        params: {
          billingAccountId: 'test-billing-account-id'
        }
      };

      response = await preHandlers.loadBillingAccount(request);
    });

    test('gets the billing account', () => {
      const [id] = services.water.invoiceAccounts.getInvoiceAccount.lastCall.args;
      expect(id).to.equal('test-billing-account-id');
    });

    test('returns the billing account', () => {
      expect(response).to.equal({
        id: 'test-billing-account-id',
        company: {
          name: 'test-company'
        }
      });
    });

    experiment('when the billing account is not found', () => {
      beforeEach(async () => {
        services.water.invoiceAccounts.getInvoiceAccount.throws(createError(404));
        response = await preHandlers.loadBillingAccount(request);
      });

      test('a Boom notFound error is returned', () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.payload.error).to.equal('Not Found');
        expect(response.message).to.equal('Cannot load billing account test-billing-account-id');
      });
    });

    experiment('when an unexpected error is thrown', () => {
      beforeEach(() => {
        services.water.invoiceAccounts.getInvoiceAccount.throws(createError(500));
      });

      test('the error is thrown', async () => {
        try {
          await preHandlers.loadBillingAccount(request);
        } catch (err) {
          expect(err.message).to.equal('oops');
          expect(err.statusCode).to.equal(500);
        }
      });
    });
  });

  experiment('.getSessionData', () => {
    experiment('when an object is set in the session', () => {
      beforeEach(async () => {
        session.get.returns({
          foo: 'bar'
        });
        response = preHandlers.getSessionData(request);
      });

      test('calls session.get with correct params', async () => {
        expect(session.get.calledWith(request, KEY)).to.be.true();
      });

      test('returns the data', async () => {
        expect(response).to.equal({ foo: 'bar' });
      });
    });

    experiment('when an object is not set in the session', () => {
      beforeEach(async () => {
        session.get.returns(undefined);
        response = preHandlers.getSessionData(request);
      });

      test('returns a Boom 404', async () => {
        expect(response.isBoom).to.equal(true);
        expect(response.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('.getBillingAccounts', () => {
    experiment('when there are no errors', () => {
      beforeEach(async () => {
        session.get.returns({
          companyId: COMPANY_ID,
          regionId: REGION_ID
        });
        services.water.companies.getCompanyInvoiceAccounts.resolves({
          data: []
        });
        response = await preHandlers.getBillingAccounts(request);
      });

      test('the service is called with the correct params', async () => {
        expect(services.water.companies.getCompanyInvoiceAccounts.calledWith(
          COMPANY_ID, REGION_ID
        )).to.be.true();
        expect(response).to.equal([]);
      });
    });

    experiment('when there is an error', () => {
      const ERROR = new Error('oops!');

      beforeEach(async () => {
        session.get.returns({
          companyId: COMPANY_ID,
          regionId: REGION_ID
        });
        services.water.companies.getCompanyInvoiceAccounts.rejects(ERROR);
      });

      test('the error is logged and rethrown', async () => {
        const func = () => preHandlers.getBillingAccounts(request);
        expect(func()).to.reject();
        expect(logger.error.calledWith(ERROR, `Cannot load billing accounts for company ${COMPANY_ID}`));
      });
    });
  });

  experiment('.getCompany', () => {
    beforeEach(async () => {
      session.get.returns({
        companyId: COMPANY_ID
      });
      response = await preHandlers.getAccount(request);
    });

    test('calls the service method with the correct params', async () => {
      expect(services.water.companies.getCompany.calledWith(COMPANY_ID)).to.be.true();
    });
  });

  experiment('.getBillingAccountLicences', () => {
    const billingAccountId = uuid();
    const apiResponse = {
      data: [{
        id: uuid()
      }]
    };

    beforeEach(async () => {
      services.water.invoiceAccounts.getLicences.resolves(apiResponse);
      request = {
        pre: {
          sessionData: {
            data: {
              id: billingAccountId
            }
          }
        }
      };
    });

    experiment('when the billing account ID is present in the session data', () => {
      beforeEach(async () => {
        response = await preHandlers.getBillingAccountLicences(request);
      });

      test('the service method is called with the ID', async () => {
        expect(services.water.invoiceAccounts.getLicences.calledWith(billingAccountId)).to.be.true();
      });

      test('the pre handler resolves with the API data', async () => {
        expect(response).to.equal(apiResponse.data);
      });
    });

    experiment('when the billing account ID is not present in the session data', () => {
      beforeEach(async () => {
        delete request.pre.sessionData.data.id;
        response = await preHandlers.getBillingAccountLicences(request);
      });

      test('the service method is not called', async () => {
        expect(services.water.invoiceAccounts.getLicences.called).to.be.false();
      });

      test('the pre handler resolves with an empty array', async () => {
        expect(response).to.equal([]);
      });
    });
  });

  experiment('.getBillingAccountBills', () => {
    let response;
    const billingAccountId = uuid();
    const apiResponse = {
      data: [{
        id: uuid()
      }],
      pagination: {
        page: 1
      }
    };

    beforeEach(async () => {
      services.water.invoiceAccounts.getInvoiceAccountInvoices.resolves(apiResponse);
      request = {
        params: {
          billingAccountId
        },
        query: {
          page: 2,
          perPage: 50
        }
      };
    });

    experiment('when the page and perPage are specified as query params', () => {
      beforeEach(async () => {
        response = await preHandlers.getBillingAccountBills(request);
      });

      test('calls the expected API connector', async () => {
        expect(services.water.invoiceAccounts.getInvoiceAccountInvoices.calledWith(
          billingAccountId, request.query.page, request.query.perPage
        )).to.be.true();
      });

      test('resolves with the api reponse', async () => {
        expect(response).to.equal(apiResponse);
      });
    });

    experiment('when the page and perPage are not specified as query params', () => {
      beforeEach(async () => {
        request.query = {};
        response = await preHandlers.getBillingAccountBills(request);
      });

      test('calls the expected API connector with defaults', async () => {
        expect(services.water.invoiceAccounts.getInvoiceAccountInvoices.calledWith(
          billingAccountId, 1, 10
        )).to.be.true();
      });

      test('resolves with the api reponse', async () => {
        expect(response).to.equal(apiResponse);
      });
    });
  });

  experiment('.getBillingAccountRebillableBills', () => {
    let response;
    const billingAccountId = uuid();

    const createBill = (overrides = {}) => ({
      id: overrides.id || uuid(),
      isDeMinimis: overrides.isDeMinimis || false,
      netTotal: overrides.isNetZero ? 0 : 345,
      invoiceNumber: overrides.invoiceNumber || 'A1234',
      batch: {
        source: overrides.source || 'wrls'
      },
      originalBillingInvoiceId: overrides.originalBillingInvoiceId || null,
      rebillingState: overrides.rebillingState || null
    });

    const apiResponse = {
      data: [
        createBill({ id: 'valid-id-1', invoiceNumber: 'A1112', rebillingState: null }),
        createBill({ id: 'valid-id-2', invoiceNumber: 'A1111', rebillingState: 'rebill' }),
        createBill({ source: 'nald' }),
        createBill({ isDeMinimis: true }),
        createBill({ isNetZero: true }),
        createBill({ originalBillingInvoiceId: uuid(), rebillingState: 'rebilled' }),
        createBill({ originalBillingInvoiceId: uuid(), rebillingState: 'reversal' })
      ],
      pagination: {
        page: 1
      }
    };

    beforeEach(async () => {
      services.water.invoiceAccounts.getInvoiceAccountInvoices.resolves(apiResponse);
      request = {
        params: {
          billingAccountId
        }
      };
      response = await preHandlers.getBillingAccountRebillableBills(request);
    });

    test('calls the expected API connector', async () => {
      expect(services.water.invoiceAccounts.getInvoiceAccountInvoices.calledWith(
        billingAccountId, 1, Number.MAX_SAFE_INTEGER
      )).to.be.true();
    });

    test('only responds with bills that can be re-billed, sorted by invoice number', async () => {
      const ids = response.map(row => row.id);
      expect(ids).to.equal([
        'valid-id-2',
        'valid-id-1'
      ]);
    });
  });
});
