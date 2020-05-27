'use strict';

const Boom = require('boom');
const Joi = require('@hapi/joi');

const { partialRight, partial } = require('lodash');

const { water } = require('../../lib/connectors/services');
const routing = require('./lib/routing');

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

const checkBatchStatus = async (request, h, status) => {
  const { batch } = request.pre;
  if (batch.status !== status) {
    return Boom.forbidden(`Batch ${batch.id} has unexpected status ${batch.status}`);
  }
  return h.continue;
};

const checkBatchStatusIsReview = partialRight(checkBatchStatus, 'review');

const validBatchStatusSchema = Joi.array().min(1).required().items(
  Joi.string().valid('processing', 'review', 'ready', 'error', 'empty', 'sent')
);

/**
 * Redirects the user if the batch is not in one of the allowed statuses
 * The allowed statuses can be set in the route configuration
 * With set with config.app.validBatchStatuses = ['processing', ...]
 */
const redirectOnBatchStatus = async (request, h) => {
  const { batch } = request.pre;
  const { validBatchStatuses } = request.route.settings.app;

  Joi.assert(validBatchStatuses, validBatchStatusSchema, `Invalid batch statuses ${validBatchStatuses} in route definition, see config.app.validBatchStatuses`);

  if (validBatchStatuses.includes(batch.status)) {
    return h.continue;
  }

  // Redirect to the correct page for this batch
  const path = routing.getBillingBatchRoute(batch, true, true);
  return h.redirect(path).takeover();
};

/**
 * Loads a list of available regions from water service
 * @return {Promise<Array>}
 */
const loadRegions = async (request, h) => {
  const { data } = await water.regions.getRegions();
  return data;
};

exports.loadBatch = partial(preHandler, config.loadBatch);
exports.checkBatchStatusIsReview = checkBatchStatusIsReview;
exports.loadInvoiceLicence = partial(preHandler, config.loadInvoiceLicence);
exports.loadInvoiceLicenceInvoice = partial(preHandler, config.loadInvoiceLicenceInvoice);

exports.redirectOnBatchStatus = redirectOnBatchStatus;
exports.loadRegions = loadRegions;
