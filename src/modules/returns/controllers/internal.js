const Boom = require('boom');
const { returns } = require('../../../lib/connectors/water');
const { documents } = require('../../../lib/connectors/crm');

const helpers = require('../lib/helpers');
const sessionHelpers = require('../lib/session-helpers');

const { handleRequest, getValues } = require('../../../lib/forms');

const {
  applyStatus,
  applyUserDetails,
  applyUnderQuery,
  applyReceivedDate,
  applyMethod,
  applyMeterDetailsProvided,
  applySingleTotalAbstractionDates
} = require('../lib/return-helpers');

const {
  internalRoutingForm
} = require('../forms/');

const {
  STEP_INTERNAL_ROUTING,
  STEP_LOG_RECEIPT,
  STEP_DATE_RECEIVED,
  STEP_INTERNAL_METHOD,
  STEP_METER_DETAILS_PROVIDED,
  STEP_SINGLE_TOTAL_DATES,
  getPreviousPath,
  getNextPath
} = require('../lib/flow-helpers');

const {
  logReceiptForm,
  logReceiptSchema,
  returnReceivedForm,
  internalMethodForm,
  meterDetailsProvidedForm,
  meterDetailsProvidedSchema,
  singleTotalAbstractionPeriodForm,
  singleTotalAbstractionPeriodSchema
} = require('../forms/');

/**
 * For internal users, routing page to decide what to do with return
 * @param {String} request.query.returnId - return ID string
 */
const getInternalRouting = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const view = await helpers.getViewData(request, data);

  const form = internalRoutingForm(request, data);

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data,
    back: getPreviousPath(STEP_INTERNAL_ROUTING, request, data)
  });
};

/**
 * Post handler for internal returns
 */
const postInternalRouting = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const view = await helpers.getViewData(request, data);

  const form = handleRequest(internalRoutingForm(request, data), request);

  if (form.isValid) {
    const values = getValues(form);
    const isQueryOption = ['set_under_query', 'clear_under_query'].includes(values.action);
    const isUnderQuery = values.action === 'set_under_query';

    if (isQueryOption) {
      let updated = applyUnderQuery(data, { isUnderQuery });
      updated = applyStatus(updated, 'received');
      updated = applyUserDetails(updated, request.auth.credentials);
      await returns.patchReturn(updated);
    }

    const path = getNextPath(STEP_INTERNAL_ROUTING, request, values);
    return h.redirect(path);
  } else {
    return h.view('water/returns/internal/form', {
      ...view,
      form,
      return: data,
      back: getPreviousPath(STEP_INTERNAL_ROUTING, request, data)
    });
  }
};

/**
 * Renders form to log receipt of a return form
 */
const getLogReceipt = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const view = await helpers.getViewData(request, data);

  return h.view('water/returns/internal/form', {
    ...view,
    form: logReceiptForm(request, data),
    return: data,
    back: getPreviousPath(STEP_INTERNAL_ROUTING, request, data)
  });
};

/**
 * POST handler for log receipt form
 */
const postLogReceipt = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const view = await helpers.getViewData(request, data);

  const form = handleRequest(logReceiptForm(request, data), request, logReceiptSchema());

  if (form.isValid) {
    // Apply received date and status to return data
    const { date_received: receivedDate } = getValues(form);
    let d = applyStatus(data, 'received', receivedDate);
    d = applyUserDetails(d, request.auth.credentials);

    // Patch returns service via water service
    await returns.patchReturn(d);

    return h.redirect(getNextPath(STEP_LOG_RECEIPT, request, data));
  } else {
    return h.view('water/returns/internal/form', {
      ...view,
      form,
      return: data,
      back: getPreviousPath(STEP_INTERNAL_ROUTING, request, data)
    });
  }
};

/**
 * Prepares view data for log receipt / under query submitted pages
 * @param {Object} request - HAPI request instance
 * @return {Promise} resolves with view data
 */
const getSubmittedViewData = async (request) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const view = await helpers.getViewData(request, data);

  // Redirect path is returns page for this licence
  const { data: [{ document_id: documentId }], error } = await documents.findMany({ system_external_id: data.licenceNumber });
  if (error) {
    throw Boom.badImplementation(`Error finding CRM document for ${data.licenceNumber}`, error);
  }
  const returnsUrl = `/admin/licences/${documentId}/returns`;

  return {
    ...view,
    return: data,
    returnsUrl
  };
};

/**
 * Success page for logging receipt of return
 */
const getReceiptLogged = async (request, h) => {
  const view = await getSubmittedViewData(request);
  return h.view('water/returns/internal/receipt-logged', view);
};

const getQueryLogged = async (request, h) => {
  const view = await getSubmittedViewData(request);
  return h.view('water/returns/internal/query-logged', view);
};

const getDateReceived = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const view = await helpers.getViewData(request, data);

  return h.view('water/returns/internal/form', {
    ...view,
    form: returnReceivedForm(request, data),
    return: data,
    back: getPreviousPath(STEP_DATE_RECEIVED, request, data)
  });
};

const postDateReceived = async (request, h) => {
  const data = await returns.getReturn(request.query.returnId);
  const view = await helpers.getViewData(request, data);

  const form = handleRequest(returnReceivedForm(request, data), request);

  if (form.isValid) {
    const d = applyReceivedDate(data, getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_DATE_RECEIVED, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

const getInternalMethod = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: internalMethodForm(request, data),
    return: data,
    back: getPreviousPath(STEP_INTERNAL_METHOD, request, data)
  });
};

const postInternalMethod = async (request, h) => {
  const { view, data } = request.returns;
  const form = handleRequest(internalMethodForm(request, data), request);

  if (form.isValid) {
    const d = applyMethod(data, getValues(form).method);
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_INTERNAL_METHOD, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

const getMeterDetailsProvided = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: meterDetailsProvidedForm(request, data),
    return: data,
    back: getPreviousPath(STEP_METER_DETAILS_PROVIDED, request, data)
  });
};

const postMeterDetailsProvided = async (request, h) => {
  const { view, data } = request.returns;
  const form = handleRequest(meterDetailsProvidedForm(request, data), request, meterDetailsProvidedSchema);

  if (form.isValid) {
    const d = applyMeterDetailsProvided(data, getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_METER_DETAILS_PROVIDED, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

const getSingleTotalAbstractionPeriod = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: singleTotalAbstractionPeriodForm(request, data),
    return: data,
    back: getPreviousPath(STEP_SINGLE_TOTAL_DATES, request, data)
  });
};

const postSingleTotalAbstractionPeriod = async (request, h) => {
  const { view, data } = request.returns;
  const form = handleRequest(
    singleTotalAbstractionPeriodForm(request, data),
    request,
    singleTotalAbstractionPeriodSchema(data)
  );

  if (form.isValid) {
    const d = applySingleTotalAbstractionDates(data, getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_SINGLE_TOTAL_DATES, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

exports.getInternalRouting = getInternalRouting;
exports.postInternalRouting = postInternalRouting;

exports.getLogReceipt = getLogReceipt;
exports.postLogReceipt = postLogReceipt;

exports.getReceiptLogged = getReceiptLogged;
exports.getQueryLogged = getQueryLogged;

exports.getDateReceived = getDateReceived;
exports.postDateReceived = postDateReceived;

exports.getInternalMethod = getInternalMethod;
exports.postInternalMethod = postInternalMethod;

exports.getMeterDetailsProvided = getMeterDetailsProvided;
exports.postMeterDetailsProvided = postMeterDetailsProvided;

exports.getSingleTotalAbstractionPeriod = getSingleTotalAbstractionPeriod;
exports.postSingleTotalAbstractionPeriod = postSingleTotalAbstractionPeriod;
