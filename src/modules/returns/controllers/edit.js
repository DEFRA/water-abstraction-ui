/**
 * Controller to allow internal colleagues to submit/edit returns data
 * @todo - ensure the user cannot edit/submit a completed return
 * @todo - ensure session data is valid at every step
 */
const { set } = require('lodash');
const Boom = require('boom');
const { importData, handleRequest, setValues, getValues } = require('../../../lib/forms');

const {
  amountsForm, methodForm, confirmForm, unitsForm,
  singleTotalForm, singleTotalSchema,
  basisForm, basisSchema,
  quantitiesForm, quantitiesSchema,
  meterDetailsForm, meterDetailsSchema,
  meterUnitsForm, meterReadingsForm, meterReadingsSchema
} = require('../forms/');

const { returns } = require('../../../lib/connectors/water');

const {
  applySingleTotal, applyBasis, applyQuantities,
  applyNilReturn, applyExternalUser, applyMeterDetails,
  applyMeterUnits, applyMeterReadings, applyMethod,
  getLinesWithReadings
} = require('../lib/return-helpers');

const {
  STEP_START,
  STEP_NIL_RETURN,
  STEP_METHOD,
  STEP_UNITS,
  STEP_SINGLE_TOTAL,
  STEP_BASIS,
  STEP_QUANTITIES,
  STEP_METER_DETAILS,
  STEP_METER_UNITS,
  STEP_METER_READINGS,
  STEP_CONFIRM,
  getNextPath,
  getPreviousPath
} = require('../lib/flow-helpers');

const {
  saveSessionData,
  deleteSessionData,
  submitReturnData } = require('../lib/session-helpers');

const { getViewData, getLicenceNumbers, getReturnTotal, canEdit } = require('../lib/helpers');

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);

  // Check CRM ownership of document
  const { entity_id: entityId } = request.auth.credentials;
  const isInternal = request.permissions.hasPermission('admin.defra');
  const documentHeaders = await getLicenceNumbers(entityId, { system_external_id: data.licenceNumber }, isInternal);
  if (documentHeaders.length === 0) {
    throw Boom.unauthorized(`Access denied to submit return ${returnId} for entity ${entityId}`);
  }

  // Check date/roles
  if (!canEdit(request.permissions, data)) {
    throw Boom.unauthorized(`Access denied to submit return ${returnId} for entity ${entityId}`);
  }

  const view = await getViewData(request, data);

  data.versionNumber = (data.versionNumber || 0) + 1;
  saveSessionData(request, applyExternalUser(data));

  const form = setValues(amountsForm(request), data);

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data,
    back: getPreviousPath(STEP_START, request, data)
  });
};

/**
 * Post handler for amounts / nil return
 * @param {String} request.query.returnId - the return to edit
 */
const postAmounts = async (request, h) => {
  const { view, data } = request.returns;
  const form = handleRequest(setValues(amountsForm(request), data), request);

  if (form.isValid) {
    const { isNil } = getValues(form);

    const d = applyNilReturn(data, isNil);
    saveSessionData(request, d);

    const path = getNextPath(STEP_START, request, d);

    return h.redirect(path);
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Confirmation screen for nil return
 */
const getNilReturn = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('water/returns/internal/nil-return', {
    ...view,
    return: data,
    form: confirmForm(request),
    back: getPreviousPath(STEP_NIL_RETURN, request, data)
  });
};

/**
 * Confirmation screen for nil return
 */
const postNilReturn = async (request, h) => {
  const { data, view } = request.returns;
  const form = handleRequest(confirmForm(request), request);

  if (form.isValid) {
    try {
      await submitReturnData(data, request);
      return h.redirect(getNextPath(STEP_NIL_RETURN, request, data));
    } catch (error) {
      request.log('error', error);
      view.error = error;
    }
  }

  return h.view('water/returns/internal/nil-return', {
    ...view,
    return: data,
    form
  });
};

/**
 * Return submitted page
 * @todo show licence name if available
 * @todo link to view return
 */
const getSubmitted = async (request, h) => {
  const { data, view, isInternal } = request.returns;

  // Clear session
  deleteSessionData(request);

  const returnUrl = `${isInternal ? '/admin' : ''}/returns/return?id=${data.returnId} `;

  return h.view('water/returns/internal/submitted', {
    ...view,
    return: data,
    returnUrl,
    pageTitle: `Abstraction return - ${data.isNil ? 'nil' : ''} submitted`
  });
};

/**
 * Routing question -
 * whether user is submitting meter readings or other
 */
const getMethod = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: methodForm(request, data),
    return: data,
    back: getPreviousPath(STEP_METHOD, request, data)
  });
};

/**
 * Post handler for routing question
 * whether user is submitting meter readings or other
 */
const postMethod = async (request, h) => {
  const { data, view } = request.returns;
  const form = handleRequest(methodForm(request, data), request);

  if (form.isValid) {
    const { method } = getValues(form);
    const d = applyMethod(data, method);
    saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_METHOD, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Form to choose units
 */
const getUnits = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: unitsForm(request, data),
    return: data,
    back: getPreviousPath(STEP_UNITS, request, data)
  });
};

/**
 * Post handler for units form
 */
const postUnits = async (request, h) => {
  const { data, view } = request.returns;
  const form = handleRequest(unitsForm(request, data), request);

  if (form.isValid) {
    // Persist chosen units to session
    const { units } = getValues(form);
    set(data, 'reading.units', units);
    saveSessionData(request, data);

    return h.redirect(getNextPath(STEP_UNITS, request, data));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Form to choose whether single figure or multiple amounts
 */
const getSingleTotal = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: singleTotalForm(request, data),
    return: data,
    back: getPreviousPath(STEP_SINGLE_TOTAL, request, data)
  });
};

/**
 * Post handler for single total
 */
const postSingleTotal = async (request, h) => {
  const { data, view } = request.returns;

  const form = handleRequest(singleTotalForm(request, data), request, singleTotalSchema);

  if (form.isValid) {
    // Persist to session
    const { isSingleTotal, total } = getValues(form);

    const d = isSingleTotal ? applySingleTotal(data, total) : data;
    set(d, 'reading.totalFlag', isSingleTotal);

    saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_SINGLE_TOTAL, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * What is the basis for the return - amounts/pump/herd
 */
const getBasis = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: basisForm(request, data),
    return: data,
    back: getPreviousPath(STEP_BASIS, request, data)
  });
};

/**
 * Post handler for basis form
 */
const postBasis = async (request, h) => {
  const { data, view } = request.returns;
  const form = handleRequest(basisForm(request, data), request, basisSchema);

  if (form.isValid) {
    const d = applyBasis(data, getValues(form));
    saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_BASIS, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Screen for user to enter quantities
 */
const getQuantities = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: quantitiesForm(request, data),
    return: data,
    back: getPreviousPath(STEP_QUANTITIES, request, data)
  });
};

const postQuantities = async (request, h) => {
  const { data, view } = request.returns;

  const schema = quantitiesSchema(data);

  const form = handleRequest(quantitiesForm(request, data), request, schema);
  if (form.isValid) {
    // Persist
    const d = applyQuantities(data, getValues(form));
    saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_QUANTITIES, request, d));
  }
  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

/**
 * Confirm screen for user to check amounts before submission
 */
const getConfirm = async (request, h) => {
  const { data, view } = request.returns;

  const lines = getLinesWithReadings(data);

  return h.view('water/returns/internal/confirm', {
    ...view,
    return: data,
    lines,
    form: confirmForm(request, `/return/confirm`),
    total: getReturnTotal(data),
    back: getPreviousPath(STEP_CONFIRM, request, data)
  });
};

/**
 * Confirm return
 */
const postConfirm = async (request, h) => {
  // Post return
  await submitReturnData(request.returns.data, request);
  return h.redirect(getNextPath(STEP_CONFIRM, request, request.returns.data));
};

const getMeterDetails = async (request, h) => {
  const { view, data } = request.returns;
  return h.view('water/returns/meter-details', {
    ...view,
    form: meterDetailsForm(request, data),
    return: data,
    back: getPreviousPath(STEP_METER_DETAILS, request, data)
  });
};

const postMeterDetails = async (request, h) => {
  const { view, data } = request.returns;
  const form = handleRequest(meterDetailsForm(request, data), request, meterDetailsSchema(data));

  if (form.isValid) {
    const d = applyMeterDetails(data, getValues(form));
    saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_METER_DETAILS, request, d));
  }

  return h.view('water/returns/meter-details', {
    ...view,
    form,
    return: data
  });
};

const getMeterUnits = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: meterUnitsForm(request, data),
    return: data,
    back: getPreviousPath(STEP_METER_UNITS, request, data)
  });
};

const postMeterUnits = async (request, h) => {
  const { view, data } = request.returns;
  const form = handleRequest(meterUnitsForm(request, data), request);

  if (form.isValid) {
    const d = applyMeterUnits(data, getValues(form));
    saveSessionData(request, d);

    return h.redirect(getNextPath(STEP_METER_UNITS, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data
  });
};

const getMeterReadings = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('water/returns/meter-readings', {
    ...view,
    form: meterReadingsForm(request, data),
    return: data,
    back: getPreviousPath(STEP_METER_READINGS, request, data)
  });
};

const postMeterReadings = async (request, h) => {
  const { view, data } = request.returns;

  const readingsForm = meterReadingsForm(request, data);

  // Get the internal repreentation of the data to pass to the schema
  // which needs the current user input in order to generate the
  // schema to cater for checking if the readings are not lower than
  // previous readings.
  const internalData = importData(readingsForm, request.payload);
  const schema = meterReadingsSchema(data, internalData);

  const form = handleRequest(readingsForm, request, schema);

  if (form.isValid) {
    const d = applyMeterReadings(data, getValues(form));
    saveSessionData(request, d);
    return h.redirect(getNextPath(STEP_METER_READINGS, request, d));
  }

  return h.view('water/returns/meter-readings', {
    ...view,
    form,
    return: data
  });
};

module.exports = {
  getAmounts,
  postAmounts,
  getNilReturn,
  postNilReturn,
  getSubmitted,
  getMethod,
  postMethod,
  getUnits,
  postUnits,
  getSingleTotal,
  postSingleTotal,
  getBasis,
  postBasis,
  getQuantities,
  postQuantities,
  getConfirm,
  postConfirm,
  getMeterDetails,
  postMeterDetails,
  getMeterUnits,
  postMeterUnits,
  getMeterReadings,
  postMeterReadings
};
