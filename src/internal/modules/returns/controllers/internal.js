const Boom = require('@hapi/boom');
const services = require('../../../lib/connectors/services');

const helpers = require('../lib/helpers');
const { get } = require('lodash');

const { handleRequest, getValues } = require('shared/lib/forms');

const { addQuery } = require('shared/modules/returns/route-helpers');
const WaterReturn = require('shared/modules/returns/models/WaterReturn');
const { STATUS_RECEIVED } = require('shared/modules/returns/models/WaterReturn');

const {
  STEP_INTERNAL_ROUTING,
  STEP_LOG_RECEIPT,
  STEP_RECEIPT_LOGGED,
  STEP_DATE_RECEIVED,
  STEP_LICENCES,
  STEP_QUERY_LOGGED
} = require('shared/modules/returns/steps');

const {
  logReceiptForm,
  logReceiptSchema,
  internalRoutingForm
} = require('../forms');

/**
 * Loads a WaterReturn instance using the supplied returnId
 * @param  {String}  returnId - return service return ID
 * @return {Promise<WaterReturn>} resolves with WaterReturn instance
 */
const loadWaterReturn = async returnId => {
  const data = await services.water.returns.getReturn(returnId);
  return new WaterReturn(data);
};

/**
 * Updates under query status of return
 * @param  {Object}  request      - hapi request
 * @param  {Boolean} isUnderQuery - whether return is under query
 * @return {Promise}
 */
const updateReturn = async (request, waterReturn, isUnderQuery, receivedDate) => {
  const { userName, entityId } = request.defra;

  waterReturn
    .setUser(userName, entityId, true)
    .setStatus(STATUS_RECEIVED)
    .setUnderQuery(isUnderQuery);

  if (receivedDate) {
    waterReturn.setReceivedDate(receivedDate);
  }

  return services.water.returns.patchReturn(waterReturn.toObject());
};

/**
 * For internal users, routing page to decide what to do with return
 * @param {String} request.query.returnId - return ID string
 */
const getInternalRouting = async (request, h, form) => {
  const { returnId } = request.query;

  const waterReturn = await loadWaterReturn(returnId);
  const data = waterReturn.toObject();
  const view = await helpers.getViewData(request, data);

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: form || internalRoutingForm(request, data),
    return: data,
    back: STEP_LICENCES
  }, { layout: false });
};

/**
 * Post handler for internal returns
 */
const postInternalRouting = async (request, h) => {
  const { returnId } = request.query;

  const waterReturn = await loadWaterReturn(returnId);
  const data = waterReturn.toObject();

  const form = handleRequest(internalRoutingForm(request, data), request);

  if (form.isValid) {
    const { action } = getValues(form);
    const isQueryOption = ['set_under_query', 'clear_under_query'].includes(action);

    if (isQueryOption) {
      await updateReturn(request, waterReturn, action === 'set_under_query');
    }

    const next = {
      log_receipt: STEP_LOG_RECEIPT,
      submit: STEP_DATE_RECEIVED,
      set_under_query: STEP_QUERY_LOGGED,
      clear_under_query: STEP_QUERY_LOGGED
    };

    return h.redirect(addQuery(request, next[action]));
  }

  return getInternalRouting(request, h, form);
};

/**
 * Renders form to log receipt of a return form
 */
const getLogReceipt = async (request, h, form) => {
  const { returnId } = request.query;

  const waterReturn = await loadWaterReturn(returnId);
  const data = waterReturn.toObject();
  const view = await helpers.getViewData(request, data);

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: form || logReceiptForm(request, data),
    return: data,
    back: addQuery(request, STEP_INTERNAL_ROUTING)
  }, { layout: false });
};

/**
 * POST handler for log receipt form
 */
const postLogReceipt = async (request, h) => {
  const { returnId } = request.query;

  const waterReturn = await loadWaterReturn(returnId);
  const data = waterReturn.toObject();

  const form = handleRequest(logReceiptForm(request, data), request, logReceiptSchema());

  if (form.isValid) {
    const values = getValues(form);
    const isUnderQuery = get(values, 'isUnderQuery[0]') === 'under_query';
    await updateReturn(request, waterReturn, isUnderQuery, values.dateReceived);

    return h.redirect(addQuery(request, STEP_RECEIPT_LOGGED));
  }

  return getLogReceipt(request, h, form);
};

/**
 * Prepares view data for log receipt / under query submitted pages
 * @param {Object} request - HAPI request instance
 * @return {Promise} resolves with view data
 */
const getSubmittedViewData = async (request) => {
  const { returnId } = request.query;

  const data = await services.water.returns.getReturn(returnId);
  const view = await helpers.getViewData(request, data);

  // Redirect path is returns page for this licence
  const documentResponse = await services.crm.documents.findMany({
    system_external_id: data.licenceNumber,
    includeExpired: true
  });

  if (documentResponse.error) {
    throw Boom.badImplementation(`Error finding CRM document for ${data.licenceNumber}`, documentResponse.error);
  }

  const document = documentResponse.data[0];
  const returnsUrl = document.metadata.IsCurrent
    ? `/licences/${document.document_id}/returns`
    : `/expired-licences/${document.document_id}`;

  return { ...view, return: data, returnsUrl };
};

/**
 * Success page for logging receipt of return
 */
const getReceiptLogged = async (request, h) => {
  const view = await getSubmittedViewData(request);
  return h.view('nunjucks/returns/receipt-logged.njk', view, { layout: false });
};

const getQueryLogged = async (request, h) => {
  const view = await getSubmittedViewData(request);
  return h.view('nunjucks/returns/query-logged.njk', view, { layout: false });
};

exports.getInternalRouting = getInternalRouting;
exports.postInternalRouting = postInternalRouting;

exports.getLogReceipt = getLogReceipt;
exports.postLogReceipt = postLogReceipt;

exports.getReceiptLogged = getReceiptLogged;
exports.getQueryLogged = getQueryLogged;
