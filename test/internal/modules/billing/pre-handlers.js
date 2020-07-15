'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { water } = require('internal/lib/connectors/services');
const preHandlers = require('internal/modules/billing/pre-handlers');

experiment('internal/modules/billing/pre-handlers', () => {
  let h;

  beforeEach(async () => {
    sandbox.stub(water.billingBatches, 'getBatch').resolves({
      id: 'test-batch-id',
      type: 'annual'
    });

    sandbox.stub(water.billingBatches, 'getBatchInvoice').resolves({
      id: 'test-invoice-id'
    });

    sandbox.stub(water.billingInvoiceLicences, 'getInvoiceLicence').resolves({
      id: 'test-invoice-licence-id'
    });

    h = {
      continue: 'continue',
      redirect: sandbox.stub().returnsThis(),
      takeover: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.loadBatch', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id'
        }
      };
    });

    test('the batch is returned from the handler', async () => {
      const result = await preHandlers.loadBatch(request);
      expect(result).to.equal({
        id: 'test-batch-id',
        type: 'annual'
      });
    });

    test('returns a Boom not found when the batch is not found', async () => {
      water.billingBatches.getBatch.rejects();
      const result = await preHandlers.loadBatch(request);

      const { payload } = result.output;
      expect(payload.statusCode).to.equal(404);
      expect(payload.message).to.equal('Batch not found for batchId: test-batch-id');
    });
  });

  experiment('.loadInvoice', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          invoiceId: 'test-invoice-id'
        }
      };
    });

    test('the invoice is returned from the handler', async () => {
      const result = await preHandlers.loadInvoice(request);
      expect(result).to.equal({
        id: 'test-invoice-id'
      });
    });

    test('returns a Boom not found when the invoice is not found', async () => {
      water.billingBatches.getBatchInvoice.rejects();
      const result = await preHandlers.loadInvoice(request);

      const { payload } = result.output;
      expect(payload.statusCode).to.equal(404);
      expect(payload.message).to.equal('Invoice not found for invoiceId: test-invoice-id');
    });
  });

  experiment('.checkBatchStatusIsReview', () => {
    experiment('when the batch is in review status', () => {
      let result;

      beforeEach(async () => {
        const request = {
          pre: {
            batch: {
              status: 'review'
            }
          }
        };
        result = await preHandlers.checkBatchStatusIsReview(request, h);
      });

      test('the pre handler returns h.continue', async () => {
        expect(result).to.equal(h.continue);
      });
    });

    experiment('when the batch is not in review status', () => {
      let result;

      beforeEach(async () => {
        const request = {
          pre: {
            batch: {
              status: 'ready'
            }
          }
        };
        result = await preHandlers.checkBatchStatusIsReview(request, h);
      });

      test('the pre handler returns a Boom forbidden error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(403);
      });
    });
  });

  experiment('.checkBatchStatusIsReady', () => {
    experiment('when the batch is in ready status', () => {
      let result;

      beforeEach(async () => {
        const request = {
          pre: {
            batch: {
              status: 'ready'
            }
          }
        };
        result = await preHandlers.checkBatchStatusIsReady(request, h);
      });

      test('the pre handler returns h.continue', async () => {
        expect(result).to.equal(h.continue);
      });
    });

    experiment('when the batch is not in ready status', () => {
      let result;

      beforeEach(async () => {
        const request = {
          pre: {
            batch: {
              status: 'review'
            }
          }
        };
        result = await preHandlers.checkBatchStatusIsReady(request, h);
      });

      test('the pre handler returns a Boom forbidden error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(403);
      });
    });
  });

  experiment('.loadInvoiceLicence', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          invoiceLicenceId: 'test-invoice-licence-id'
        }
      };
    });

    test('the invoice licence is returned from the handler', async () => {
      const result = await preHandlers.loadInvoiceLicence(request);
      expect(result).to.equal({
        id: 'test-invoice-licence-id'
      });
    });

    test('returns a Boom not found when the batch is not found', async () => {
      water.billingInvoiceLicences.getInvoiceLicence.rejects();
      const result = await preHandlers.loadInvoiceLicence(request);

      const { payload } = result.output;
      expect(payload.statusCode).to.equal(404);
      expect(payload.message).to.equal('Invoice licence not found for invoiceLicenceId: test-invoice-licence-id');
    });
  });

  experiment('.loadInvoiceLicenceInvoice', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id',
          invoiceLicenceId: 'test-invoice-licence-id'
        },
        pre: {
          invoiceLicence: {
            invoiceId: 'test-invoice-id'
          }
        }
      };
    });

    test('the invoice licence is returned from the handler', async () => {
      const result = await preHandlers.loadInvoiceLicenceInvoice(request);
      expect(result).to.equal({
        id: 'test-invoice-id'
      });
    });

    test('returns a Boom not found when the batch is not found', async () => {
      water.billingBatches.getBatchInvoice.rejects();
      const result = await preHandlers.loadInvoiceLicenceInvoice(request);

      const { payload } = result.output;
      expect(payload.statusCode).to.equal(404);
      expect(payload.message).to.equal('Invoice not found for invoiceLicenceId: test-invoice-licence-id');
    });
  });

  experiment('.redirectOnBatchStatus', () => {
    let request;

    test('throws an error if the route definition does not define valid statuses', async () => {
      request = {
        route: {
          settings: {
            app: {

            }
          }
        }
      };
      const func = () => preHandlers.redirectOnBatchStatus(request, h);
      expect(func()).to.reject();
    });

    test('throws an error if the route definition includes invalid statuses', async () => {
      request = {
        route: {
          settings: {
            app: {
              validBatchStatuses: ['processing', 'procrastinating']
            }
          }
        }
      };
      const func = () => preHandlers.redirectOnBatchStatus(request, h);
      expect(func()).to.reject();
    });

    test('returns h.continue if the batch is in one of valid statuses defined on the route', async () => {
      request = {
        pre: {
          batch: {
            status: 'processing'
          }
        },
        route: {
          settings: {
            app: {
              validBatchStatuses: ['processing']
            }
          }
        }
      };
      const result = await preHandlers.redirectOnBatchStatus(request, h);
      expect(result).to.equal(h.continue);
    });

    test('returns h.redirect if the batch is not in one of valid statuses defined on the route', async () => {
      request = {
        pre: {
          batch: {
            id: 'test-batch-id',
            status: 'processing'
          }
        },
        route: {
          settings: {
            app: {
              validBatchStatuses: ['ready', 'sent']
            }
          }
        }
      };
      await preHandlers.redirectOnBatchStatus(request, h);

      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/billing/batch/test-batch-id/processing?back=1');
      expect(h.takeover.called).to.be.true();
    });
  });
});
