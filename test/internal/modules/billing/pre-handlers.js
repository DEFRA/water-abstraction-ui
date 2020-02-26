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
  beforeEach(async () => {
    sandbox.stub(batchService, 'getBatch').resolves({
      id: 'test-batch-id',
      type: 'annual'
    });

    sandbox.stub(eventService, 'getEventForBatch').resolves();
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
    let h;

    beforeEach(async () => {
      request = {
        defra: {},
        params: {
          batchId: 'test-batch-id'
        }
      };
      h = {
        continue: 'continue',
        redirect: sandbox.spy()
      };
    });

    test('redirects to waiting if the event is not in the complete state', async () => {
      eventService.getEventForBatch.resolves({
        event_id: 'test-event-id',
        status: 'not-completed'
      });

      await preHandlers.redirectToWaitingIfEventNotComplete(request, h);
      expect(h.redirect.calledWith('/waiting/test-event-id')).to.be.true();
    });

    test('continues if the status of the event is completed', async () => {
      eventService.getEventForBatch.resolves({
        status: 'complete'
      });

      const result = await preHandlers.redirectToWaitingIfEventNotComplete(request, h);
      expect(result).to.equal(h.continue);
    });
  });
});
