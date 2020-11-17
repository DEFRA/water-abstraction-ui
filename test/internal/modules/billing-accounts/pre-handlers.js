'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const services = require('internal/lib/connectors/services');
const preHandlers = require('internal/modules/billing-accounts/pre-handlers');

const createError = code => {
  const error = new Error('oops');
  error.statusCode = code;
  return error;
};

experiment('internal/modules/billing-accounts/pre-handlers', () => {
  beforeEach(() => {
    sandbox.stub(services.water.billingAccounts, 'getBillingAccount').resolves({
      id: 'test-billing-account-id',
      company: {
        name: 'test-company'
      }
    });
  });

  afterEach(() => sandbox.restore());

  experiment('.loadBillingAccount', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          billingAccountId: 'test-billing-account-id'
        }
      };

      result = await preHandlers.loadBillingAccount(request);
    });

    test('gets the billing account', () => {
      const [id] = services.water.billingAccounts.getBillingAccount.lastCall.args;
      expect(id).to.equal('test-billing-account-id');
    });

    test('returns the billing account', () => {
      expect(result).to.equal({
        id: 'test-billing-account-id',
        company: {
          name: 'test-company'
        }
      });
    });

    experiment('when the billing account is not found', () => {
      beforeEach(async () => {
        services.water.billingAccounts.getBillingAccount.throws(createError(404));
        result = await preHandlers.loadBillingAccount(request);
      });

      test('a Boom notFound error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.payload.error).to.equal('Not Found');
        expect(result.message).to.equal('Cannot load billing account test-billing-account-id');
      });
    });

    experiment('when an unexpected error is thrown', () => {
      beforeEach(() => {
        services.water.billingAccounts.getBillingAccount.throws(createError(500));
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
});
