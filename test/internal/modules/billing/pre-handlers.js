'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

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
    let result;
    let h;

    beforeEach(async () => {
      request = {
        defra: {},
        params: {
          batchId: 'test-batch-id'
        }
      };
      h = { continue: 'continue' };

      result = await preHandlers.loadBatch(request, h);
    });

    test('the batch is added to request.defra', async () => {
      expect(request.defra.batch).to.equal({
        id: 'test-batch-id',
        type: 'annual'
      });
    });

    test('the handler returns h.continue', async () => {
      expect(result).to.equal('continue');
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
