'use strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/billing/routes');
// testing routes exist and only accessible to users with billing role
experiment('internal/modules/billing/routes', () => {
  experiment('.getBillingBatchType', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchType.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.postBillingBatchType', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingBatchType.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.getBillingBatchRegion', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchRegion.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.postBillingBatchRegion', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingBatchRegion.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.getBillingBatchExist', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchExist.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.getBillingBatchSummary', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchSummary.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.getBillingBatchInvoice', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchInvoice.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
});
