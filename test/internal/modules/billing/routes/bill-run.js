'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const preHandlers = require('internal/modules/billing/pre-handlers');
const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/billing/routes/bill-run');

experiment('internal/modules/billing/routes', () => {
  experiment('.getBillingBatchSummary', () => {
    test('uses the loadBatch pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchSummary.config.pre;
      expect(routePreHandlers[0]).to.equal({ method: preHandlers.loadBatch, assign: 'batch' });
    });

    test('uses the redirectOnBatchStatus pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchSummary.config.pre;
      expect(routePreHandlers[1]).to.equal({ method: preHandlers.redirectOnBatchStatus });
    });

    test('redirects unless batch status is "ready" or "sent"', async () => {
      const { validBatchStatuses } = routes.getBillingBatchSummary.config.app;
      expect(validBatchStatuses).to.equal(['ready', 'sent']);
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

  experiment('.getBillingBatchDeleteInvoice', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.getBillingBatchDeleteInvoice.config.auth.scope)
        .to.only.include([scope.billing]);
    });

    test('uses the loadBatch pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchDeleteInvoice.config.pre;
      expect(routePreHandlers[0]).to.equal({ method: preHandlers.loadBatch, assign: 'batch' });
    });

    test('uses the loadInvoice pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchDeleteInvoice.config.pre;
      expect(routePreHandlers[1]).to.equal({ method: preHandlers.loadInvoice, assign: 'invoice' });
    });

    test('uses the checkBatchStatusIsReady pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchDeleteInvoice.config.pre;
      expect(routePreHandlers[2]).to.equal(preHandlers.checkBatchStatusIsReady);
    });
  });

  experiment('.postBillingBatchDeleteInvoice', () => {
    test('limits scope to users with billing role', async () => {
      expect(routes.postBillingBatchDeleteInvoice.config.auth.scope)
        .to.only.include([scope.billing]);
    });
  });

  experiment('.getBillingBatchProcessing', () => {
    test('uses the loadBatch pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchProcessing.config.pre;
      expect(routePreHandlers[0]).to.equal({ method: preHandlers.loadBatch, assign: 'batch' });
    });

    test('uses the redirectOnBatchStatus pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchProcessing.config.pre;
      expect(routePreHandlers[1]).to.equal({ method: preHandlers.redirectOnBatchStatus });
    });

    test('redirects unless batch status is "processing" or "error"', async () => {
      const { validBatchStatuses } = routes.getBillingBatchProcessing.config.app;
      expect(validBatchStatuses).to.equal(['processing', 'error']);
    });
  });

  experiment('.getBillingBatchEmpty', () => {
    test('uses the loadBatch pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchEmpty.config.pre;
      expect(routePreHandlers[0]).to.equal({ method: preHandlers.loadBatch, assign: 'batch' });
    });

    test('uses the redirectOnBatchStatus pre handler', async () => {
      const routePreHandlers = routes.getBillingBatchEmpty.config.pre;
      expect(routePreHandlers[1]).to.equal({ method: preHandlers.redirectOnBatchStatus });
    });

    test('redirects unless batch status is "empty"', async () => {
      const { validBatchStatuses } = routes.getBillingBatchEmpty.config.app;
      expect(validBatchStatuses).to.equal(['empty']);
    });
  });
});
