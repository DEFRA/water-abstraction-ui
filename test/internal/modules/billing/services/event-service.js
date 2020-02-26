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
const uuid = require('uuid/v4');

const services = require('internal/lib/connectors/services');
const eventService = require('internal/modules/billing/services/event-service');

experiment('internal/modules/billing/services/eventService', () => {
  let batchId;
  let eventId;

  beforeEach(async () => {
    eventId = uuid();
    batchId = uuid();

    sandbox.stub(services.water.events, 'findMany').resolves({
      data: [
        { event_id: eventId }
      ]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getEventForBatch', () => {
    test('provides the expected query filter', async () => {
      await eventService.getEventForBatch(batchId);

      const [filter] = services.water.events.findMany.lastCall.args;
      expect(filter.type).to.equal('billing-batch');
      expect(filter["metadata->'batch'->>'billing_batch_id'"]).to.equal(batchId);
    });

    test('returns null if no data is returned', async () => {
      services.water.events.findMany.resolves({
        data: []
      });

      const result = await eventService.getEventForBatch(batchId);
      expect(result).to.be.null();
    });

    test('returns the data if found', async () => {
      const result = await eventService.getEventForBatch(batchId);
      expect(result.event_id).to.equal(eventId);
    });
  });
});
