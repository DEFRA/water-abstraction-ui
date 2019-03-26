/**
 * Controller to allow internal colleagues to submit/edit returns data
 * @todo - ensure the user cannot edit/submit a completed return
 * @todo - ensure session data is valid at every step
 */
const { get, set, findLastKey } = require('lodash');
const Boom = require('boom');
const forms = require('../../../lib/forms');
const logger = require('../../../lib/logger');

const {
  amountsForm, methodForm, confirmForm, unitsForm,
  singleTotalForm, singleTotalSchema,
  quantitiesForm, quantitiesSchema,
  meterDetailsForm, meterDetailsSchema,
  meterUnitsForm, meterReadingsForm, meterReadingsSchema,
  meterResetForm
} = require('../forms/');

const { returns } = require('../../../lib/connectors/water');

const {
  applySingleTotal, applyQuantities,
  applyNilReturn, applyExternalUser, applyMeterDetails,
  applyMeterUnits, applyMeterReadings, applyMethod,
  getLinesWithReadings, applyStatus, applyUnderQuery,
  applyMeterReset
} = require('../lib/return-helpers');

const returnPath = require('../lib/return-path');
const permissions = require('../../../lib/permissions');

const flowHelpers = require('../lib/flow-helpers');

const sessionHelpers = require('../lib/session-helpers');

const helpers = require('../lib/helpers');

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { returnId } = request.query;

  const data = await returns.getReturn(returnId);

  // Check CRM ownership of document
  const filter = { system_external_id: data.licenceNumber };
  const documentHeaders = await helpers.getLicenceNumbers(request, filter);
  if (documentHeaders.length === 0) {
    throw Boom.unauthorized(`Access denied to submit return ${returnId}`, request.auth.credentials);
  }

  // Check date/roles
  if (!(returnPath.isInternalEdit(data, request) || permissions.isExternalReturns(request))) {
    throw Boom.unauthorized(`Access denied to submit return ${returnId}`, request.auth.credentials);
  }

  const view = await helpers.getViewData(request, data);

  data.versionNumber = (data.versionNumber || 0) + 1;
  sessionHelpers.saveSessionData(request, applyExternalUser(data));

  const form = forms.setValues(amountsForm(request), data);
  console.log(data);

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_START, request, data)
  }, { layout: false });
};

/**
 * Post handler for amounts / nil return
 * @param {String} request.query.returnId - the return to edit
 */
const postAmounts = async (request, h) => {
  const { view, data } = request.returns;
  const form = forms.handleRequest(forms.setValues(amountsForm(request), data), request);

  if (form.isValid) {
    const { isNil } = forms.getValues(form);

    const d = applyNilReturn(data, isNil);
    sessionHelpers.saveSessionData(request, d);

    const path = flowHelpers.getNextPath(flowHelpers.STEP_START, request, d);

    return h.redirect(path);
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data
  }, { layout: false });
};

/**
 * Confirmation screen for nil return
 */
const getNilReturn = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('nunjucks/returns/nil-return.njk', {
    ...view,
    return: data,
    form: confirmForm(request, data),
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_NIL_RETURN, request, data)
  }, { layout: false });
};

/**
 * Post handler for amounts or nil return flow
 * For internal users, also sets/clears under query status
 */
const postConfirm = async (request, h) => {
  const { data } = request.returns;
  const form = forms.handleRequest(confirmForm(request, data), request);

  if (form.isValid) {
    try {
      // Apply status / under query
      let updated = applyStatus(data);
      if (permissions.isInternal(request)) {
        updated = applyUnderQuery(updated, forms.getValues(form));
      }
      await sessionHelpers.submitReturnData(updated, request);
      return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_NIL_RETURN, request, data));
    } catch (error) {
      logger.error('Post confirm return error', error);
      throw Boom.badImplementation(`Return submission error`, { data, form });
    }
  }
};

/**
 * Return submitted page
 * @todo show licence name if available
 * @todo link to view return
 */
const getSubmitted = async (request, h) => {
  const { data, view, isInternal } = request.returns;

  // Clear session
  sessionHelpers.deleteSessionData(request);

  const returnUrl = `${isInternal ? '/admin' : ''}/returns/return?id=${data.returnId}`;

  return h.view('water/returns/internal/submitted', {
    ...view,
    return: data,
    returnUrl,
    pageTitle: `Abstraction return - ${data.isNil ? 'nil ' : ''}submitted`
  });
};

/**
 * Routing question -
 * whether user is submitting meter readings or other
 */
const getMethod = async (request, h) => {
  const { data, view } = request.returns;
  console.log(JSON.stringify(view));
  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: methodForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METHOD, request, data)
  }, { layout: false });
};

/**
 * Post handler for routing question
 * whether user is submitting meter readings or other
 */
const postMethod = async (request, h) => {
  const { data, view } = request.returns;
  const form = forms.handleRequest(methodForm(request, data), request);

  if (form.isValid) {
    const { method } = forms.getValues(form);
    const d = applyMethod(data, method);
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METHOD, request, d));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data
  }, { layout: false });
};

/**
 * Form to choose units
 */
const getUnits = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: unitsForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_UNITS, request, data)
  }, { layout: false });
};

/**
 * Post handler for units form - deals with Volumes or Estimates
 */
const postUnits = async (request, h) => {
  const { data, view } = request.returns;
  const form = forms.handleRequest(unitsForm(request, data), request);

  if (form.isValid) {
    // Persist chosen units to session
    const { units } = forms.getValues(form);
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    const readingType = isVolumes ? 'measured' : 'estimated';

    set(data, 'reading.units', units);
    set(data, 'reading.type', readingType);
    sessionHelpers.saveSessionData(request, data);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_UNITS, request, data));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data
  }, { layout: false });
};

/**
 * Form to choose whether single figure or multiple amounts
 */
const getSingleTotal = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: singleTotalForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_SINGLE_TOTAL, request, data)
  }, { layout: false });
};

/**
 * Post handler for single total
 */
const postSingleTotal = async (request, h) => {
  const { data, view } = request.returns;

  const form = forms.handleRequest(singleTotalForm(request, data), request, singleTotalSchema);

  if (form.isValid) {
    // Persist to session
    const { isSingleTotal, total } = forms.getValues(form);

    const d = isSingleTotal ? applySingleTotal(data, total) : data;
    set(d, 'reading.totalFlag', isSingleTotal);

    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_SINGLE_TOTAL, request, d));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data
  }, { layout: false });
};

/**
 * What is the basis for the return - amounts/pump/herd
 */
/*
const getBasis = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: basisForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_BASIS, request, data)
  });
};
*/

/**
 * Post handler for basis form
 */
/*
const postBasis = async (request, h) => {
  const { data, view } = request.returns;
  const form = forms.handleRequest(basisForm(request, data), request, basisSchema);

  if (form.isValid) {
    const d = applyBasis(data, forms.getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_BASIS, request, d));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data
  }, { layout: false });
};
*/

/**
 * Screen for user to enter quantities
 */
const getQuantities = async (request, h) => {
  const { data, view } = request.returns;

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: quantitiesForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_QUANTITIES, request, data)
  }, { layout: false });
};

const postQuantities = async (request, h) => {
  const { data, view } = request.returns;

  const schema = quantitiesSchema(data);

  const form = forms.handleRequest(quantitiesForm(request, data), request, schema);
  if (form.isValid) {
    // Persist
    const d = applyQuantities(data, forms.getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_QUANTITIES, request, d));
  }
  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data
  }, { layout: false });
};

/**
 * Confirm screen for user to check amounts before submission
 */
const getConfirm = async (request, h) => {
  const { data, view } = request.returns;

  const lines = getLinesWithReadings(data);
  const form = confirmForm(request, data, `/return/confirm`);

  const isReadings = get(data, 'reading.method') === 'oneMeter';
  const endReadingKey = findLastKey(get(data, 'meters[0].readings'), key => key > 0);

  return h.view('water/returns/internal/confirm', {
    ...view,
    return: data,
    lines,
    form,
    total: helpers.getReturnTotal(data),
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_CONFIRM, request, data),
    makeChangePath: isReadings ? '/return/meter/readings' : 'return/quantities',
    endReading: get(data, `meters[0].readings.${endReadingKey}`)
  });
};

const getMeterDetails = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('water/returns/meter-details', {
    ...view,
    form: meterDetailsForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_DETAILS, request, data)
  });
};

const postMeterDetails = async (request, h) => {
  const { view, data } = request.returns;
  const form = forms.handleRequest(meterDetailsForm(request, data), request, meterDetailsSchema(data));

  if (form.isValid) {
    const d = applyMeterDetails(data, forms.getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METER_DETAILS, request, d));
  }

  return h.view('water/returns/meter-details', {
    ...view,
    form,
    return: data
  });
};

const getMeterUnits = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: meterUnitsForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_UNITS, request, data)
  }, { layout: false });
};

const postMeterUnits = async (request, h) => {
  const { view, data } = request.returns;
  const form = forms.handleRequest(meterUnitsForm(request, data), request);

  if (form.isValid) {
    const d = applyMeterUnits(data, forms.getValues(form));

    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METER_UNITS, request, d));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data
  }, { layout: false });
};

const getMeterReset = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: meterResetForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_RESET, request, data)
  }, { layout: false });
};

const postMeterReset = async (request, h) => {
  const { view, data } = request.returns;
  const form = forms.handleRequest(meterResetForm(request, data), request);

  if (form.isValid) {
    const d = applyMeterReset(data, forms.getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METER_RESET, request, d));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data
  }, { layout: false });
};

const getMeterReset = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: meterResetForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_RESET, request, data)
  });
};

const postMeterReset = async (request, h) => {
  const { view, data } = request.returns;
  const form = forms.handleRequest(meterResetForm(request, data), request);

  if (form.isValid) {
    const d = applyMeterReset(data, forms.getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METER_RESET, request, d));
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
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_READINGS, request, data)
  });
};

const postMeterReadings = async (request, h) => {
  const { view, data } = request.returns;

  const readingsForm = meterReadingsForm(request, data);

  // Get the internal representation of the data to pass to the schema
  // which needs the current user input in order to generate the
  // schema to cater for checking if the readings are not lower than
  // previous readings.
  const internalData = forms.importData(readingsForm, request.payload);

  const schema = meterReadingsSchema(data, internalData);

  const form = forms.handleRequest(readingsForm, request, schema);

  if (form.isValid) {
    const d = applyMeterReadings(data, forms.getValues(form));
    sessionHelpers.saveSessionData(request, d);
    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METER_READINGS, request, d));
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
  getSubmitted,
  getMethod,
  postMethod,
  getUnits,
  postUnits,
  getSingleTotal,
  postSingleTotal,
  getQuantities,
  postQuantities,
  getConfirm,
  postConfirm,
  getMeterDetails,
  postMeterDetails,
  getMeterUnits,
  postMeterUnits,
  getMeterReset,
  postMeterReset,
  getMeterReadings,
  postMeterReadings
};
