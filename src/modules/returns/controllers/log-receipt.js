const Boom = require('boom');
const { returns } = require('../../../lib/connectors/water');
const { documents } = require('../../../lib/connectors/crm');

const { getViewData } = require('../lib/helpers');
const { handleRequest, getValues } = require('../../../lib/forms');
const { applyStatus, applyUserDetails } = require('../lib/return-helpers');

const {
  STEP_INTERNAL_ROUTING,
  STEP_LOG_RECEIPT,
  getPreviousPath,
  getNextPath
} = require('../lib/flow-helpers');

const {
  logReceiptForm,
  logReceiptSchema
} = require('../forms/');

/**
 * Renders form to log receipt of a return form
 */
const getLogReceipt = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const view = await getViewData(request, data);

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
  const view = await getViewData(request, data);

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
 * Success page for logging receipt of return
 */
const getReceiptLogged = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);
  const view = await getViewData(request, data);

  // Redirect path is returns page for this licence
  const { data: [{ document_id: documentId }], error } = await documents.findMany({ system_external_id: data.licenceNumber });
  if (error) {
    throw Boom.badImplementation(`Error finding CRM document for ${data.licenceNumber}`, error);
  }
  const returnsUrl = `/admin/licences/${documentId}/returns`;

  return h.view('water/returns/internal/receipt-logged', {
    ...view,
    return: data,
    returnsUrl
  });
};

module.exports = {
  getLogReceipt,
  postLogReceipt,
  getReceiptLogged
};
