'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const eventService = require('internal/modules/billing/services/event-service');
const batchService = require('internal/modules/billing/services/batch-service');
const preHandlers = require('internal/modules/billing/pre-handlers');

experiment('internal/modules/billing/pre-handlers', () => {
  let h;

  beforeEach(async () => {
    sandbox.stub(batchService, 'getBatch').resolves({
      id: 'test-batch-id',
      type: 'annual'
    });

    sandbox.stub(eventService, 'getEventForBatch').resolves();

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
      batchService.getBatch.rejects();
      const result = await preHandlers.loadBatch(request);

      const { payload } = result.output;
      expect(payload.statusCode).to.equal(404);
      expect(payload.message).to.equal('Batch not found for id: test-batch-id');
    });
  });

  experiment('.redirectToWaitingIfEventNotComplete', () => {
    let request;

    beforeEach(async () => {
      request = {
        defra: {},
        params: {
          batchId: 'test-batch-id'
        }
      };
    });

    experiment('if the event is not in the complete state', () => {
      beforeEach(async () => {
        eventService.getEventForBatch.resolves({
          event_id: 'test-event-id',
          status: 'not-completed'
        });

        await preHandlers.redirectToWaitingIfEventNotComplete(request, h);
      });

      test('takes over the response', async () => {
        expect(h.takeover.called).to.be.true();
      });

      test('redirects to waiting page', async () => {
        expect(h.redirect.calledWith('/waiting/test-event-id')).to.be.true();
      });
    });

    test('continues if the status of the event is completed', async () => {
      eventService.getEventForBatch.resolves({
        status: 'complete'
      });

      const result = await preHandlers.redirectToWaitingIfEventNotComplete(request, h);
      expect(result).to.equal(h.continue);
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
});
