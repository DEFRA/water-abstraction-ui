'use strict';

const Boom = require('boom');
const { partialRight, partial } = require('lodash');

const eventService = require('./services/event-service');
const { water } = require('../../lib/connectors/services');

const getBatch = request =>
  water.billingBatches.getBatch(request.params.batchId);

const getInvoiceLicence = request =>
  water.billingInvoiceLicences.getInvoiceLicence(request.params.invoiceLicenceId);

const getInvoiceLicenceInvoice = request => {
  const { batchId } = request.params;
  const { invoiceId } = request.pre.invoiceLicence;
  return water.billingBatches.getBatchInvoice(batchId, invoiceId);
};

const config = {
  loadBatch: {
    connector: getBatch,
    key: 'batchId',
    errorMessage: 'Batch not found'
  },
  loadInvoiceLicence: {
    connector: getInvoiceLicence,
    key: 'invoiceLicenceId',
    errorMessage: 'Invoice licence not found'
  },
  loadInvoiceLicenceInvoice: {
    connector: getInvoiceLicenceInvoice,
    key: 'invoiceLicenceId',
    errorMessage: 'Invoice not found'
  }
};

/**
 * A default pre handler implementation which loads data using the supplied
 * function and resolves with it, throwing a Boom not found error if an error occurs
 * @param {Object} config
 * @param {Function} config.connector - an async function to retrieve data based on the request
 * @param {String} config.key - the key in request.params containing the ID to load
 * @param {String} config.errorMessage - an error message if data not found
 * @param {Object} request - HAPI request
 * @param {Object} h - HAPI response toolkit
 */
const preHandler = async (config, request, h) => {
  try {
    const response = await config.connector(request);
    return response;
  } catch (err) {
    const msg = `${config.errorMessage} for ${config.key}: ${request.params[config.key]}`;
    return Boom.notFound(msg);
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
    return Boom.forbidden(`Batch ${batch.id} has unexpected status ${batch.status}`);
  }
  return h.continue;
};

const checkBatchStatusIsReview = partialRight(checkBatchStatus, 'review');

exports.loadBatch = partial(preHandler, config.loadBatch);
exports.redirectToWaitingIfEventNotComplete = redirectToWaitingIfEventNotComplete;
exports.checkBatchStatusIsReview = checkBatchStatusIsReview;
exports.loadInvoiceLicence = partial(preHandler, config.loadInvoiceLicence);
exports.loadInvoiceLicenceInvoice = partial(preHandler, config.loadInvoiceLicenceInvoice);
