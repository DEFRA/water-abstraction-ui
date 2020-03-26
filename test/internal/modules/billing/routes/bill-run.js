'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const preHandlers = require('internal/modules/billing/pre-handlers');
const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/billing/routes/bill-run');

experiment('internal/modules/billing/routes', () => {
  experiment('.getBillingBatchSummary', () => {
    test('uses the redirectToWaitingIfEventNotCompleted pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchSummary.config.pre;
      expect(routePreHandlers).to.contain(preHandlers.redirectToWaitingIfEventNotComplete);
    });
  });

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

  experiment('.getBillingBatchExists', () => {
    const route = routes.getBillingBatchExists;
    test('limits scope to users with billing role', async () => {
      expect(route.config.auth.scope)
        .to.only.include([scope.billing]);
    });

    test('uses a pre handler to load the batch', async () => {
      expect(route.config.pre).to.have.length(1);
      expect(route.config.pre[0].method).to.equal(preHandlers.loadBatch);
      expect(route.config.pre[0].assign).to.equal('batch');
    });
  });

  experiment('.getBillingBatchSummary', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchSummary.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });

  experiment('.getTransactionsCSV', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getTransactionsCSV.config.auth.scope);
    });
  });

  experiment('.getBillingBatchInvoice', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchInvoice.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });

  experiment('.getBillingBatchDeleteAccount', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchDeleteAccount.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });

  experiment('.postBillingBatchDeleteAccount', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingBatchDeleteAccount.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });
});
