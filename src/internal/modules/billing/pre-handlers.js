'use strict';

const Boom = require('boom');
const { partialRight } = require('lodash');

const batchService = require('./services/batch-service');
const eventService = require('./services/event-service');
const services = require('../../lib/connectors/services');

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

const checkBatchStatus = async (request, h, status) => {
  const { batch } = request.pre;
  if (batch.status !== status) {
    return Boom.badRequest(`Batch ${batch.id} has unexpected status ${batch.status}`);
  }
  return h.continue;
};

const checkBatchIsTwoPartTariffReview = partialRight(checkBatchStatus, 'review');

const loadInvoiceLicence = async request => {
  const { invoiceLicenceId } = request.params;

  try {
    const invoiceLicence = await services.water.billingInvoiceLicences.getInvoiceLicence(invoiceLicenceId);
    return invoiceLicence;
  } catch (err) {
    return Boom.notFound(`Invoice licence not found for id: ${invoiceLicenceId}`);
  }
};

exports.loadBatch = loadBatch;
exports.redirectToWaitingIfEventNotComplete = redirectToWaitingIfEventNotComplete;
exports.checkBatchIsTwoPartTariffReview = checkBatchIsTwoPartTariffReview;
exports.loadInvoiceLicence = loadInvoiceLicence;
