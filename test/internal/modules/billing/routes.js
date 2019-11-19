'use strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/billing/routes');

experiment('internal/modules/billing/routes', () => {
  experiment('.getBillingBatchType', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchType.options.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.postBillingBatchType', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingBatchType.options.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.getBillingBatchRegion', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchRegion.options.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
  experiment('.postBillingBatchRegion', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingBatchRegion.options.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
});
