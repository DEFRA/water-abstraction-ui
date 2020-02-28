'use strict';

const Boom = require('boom');

const batchService = require('./services/batch-service');
const eventService = require('./services/event-service');

const loadBatch = async request => {
  const { batchId } = request.params;

  try {
    const batch = await batchService.getBatch(batchId);
    return batch;
  } catch (err) {
    return Boom.notFound(`Batch not found for id: ${batchId}`);
  }
};

const redirectToWaitingIfEventNotComplete = async (request, h) => {
  const { batchId } = request.params;
  const event = await eventService.getEventForBatch(batchId);

  return (event.status === 'complete')
    ? h.continue
    : h.redirect(`/waiting/${event.event_id}`).takeover();
};

exports.loadBatch = loadBatch;
exports.redirectToWaitingIfEventNotComplete = redirectToWaitingIfEventNotComplete;
