'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { getBillingBatchRoute } = require('internal/modules/billing/lib/routing');

experiment('internal/modules/billing/lib/routing', () => {
  experiment('.getBillingBatchRoute', () => {
    const batch = { id: 'test-batch-id' };
    experiment('when batch status is "processing"', () => {
      beforeEach(() => {
        batch.status = 'processing';
      });

      test('returns the expected url', () => {
        expect(getBillingBatchRoute(batch)).to.startWith('/billing/batch/test-batch-id/processing');
      });

      test('sets back query param to 0 by default', () => {
        expect(getBillingBatchRoute(batch)).to.endWith('?back=0');
      });

      test('sets back query param to 1 when isBackEnabled is true', () => {
        expect(getBillingBatchRoute(batch, { isBackEnabled: true })).to.endWith('?back=1');
      });
    });

    experiment('when batch status is "ready"', () => {
      test('returns the batch summary url if no invoice ID is supplied', () => {
        batch.status = 'ready';
        expect(getBillingBatchRoute(batch)).to.equal('/billing/batch/test-batch-id/summary');
      });

      test('returns the invoice page if an invoice ID is supplied', () => {
        batch.status = 'ready';
        const options = {
          invoiceId: 'test-invoice-id'
        };
        expect(getBillingBatchRoute(batch, options)).to.equal('/billing/batch/test-batch-id/invoice/test-invoice-id');
      });
    });

    experiment('when batch status is "sent"', () => {
      beforeEach(() => {
        batch.status = 'sent';
      });

      test('returns the summary url by default', () => {
        expect(getBillingBatchRoute(batch)).to.equal('/billing/batch/test-batch-id/summary');
      });

      test('returns success page url when showSuccessPage flag is true', () => {
        expect(getBillingBatchRoute(batch, { showSuccessPage: true })).to.equal('/billing/batch/test-batch-id/confirm/success');
      });
    });

    experiment('when batch status is "review"', () => {
      test('returns the summary url by default', () => {
        batch.status = 'review';
        expect(getBillingBatchRoute(batch)).to.equal('/billing/batch/test-batch-id/two-part-tariff-review');
      });
    });

    experiment('when isErrorRoutesIncluded flag is true', () => {
      test('and batch status is "error" returns the processing page url', () => {
        batch.status = 'error';
        expect(getBillingBatchRoute(batch, { isErrorRoutesIncluded: true })).to.equal('/billing/batch/test-batch-id/processing');
      });

      test('and batch status is "empty" returns the empty batch page url', () => {
        batch.status = 'empty';
        expect(getBillingBatchRoute(batch, { isErrorRoutesIncluded: true })).to.equal('/billing/batch/test-batch-id/empty');
      });
    });
  });
});
