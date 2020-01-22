'use strict';

const batchService = require('./services/batch-service');
const eventService = require('./services/event-service');

const loadBatch = async (request, h) => {
  const { batchId } = request.params;
  const batch = await batchService.getBatch(batchId);
  request.defra.batch = batch;
  return h.continue;
};

const redirectToWaitingIfEventNotComplete = async (request, h) => {
  const { batchId } = request.params;
  const event = await eventService.getEventForBatch(batchId);

  return (event.status === 'complete')
    ? h.continue
    : h.redirect(`/waiting/${event.event_id}`);
};

exports.loadBatch = loadBatch;
exports.redirectToWaitingIfEventNotComplete = redirectToWaitingIfEventNotComplete;
