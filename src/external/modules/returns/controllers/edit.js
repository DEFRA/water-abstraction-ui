/**
 * Controller to allow internal colleagues to submit/edit returns data
 * @todo - ensure the user cannot edit/submit a completed return
 * @todo - ensure session data is valid at every step
 */
const { get, set } = require('lodash');
const Boom = require('boom');
const forms = require('shared/lib/forms');
const { logger } = require('../../../logger');

const {
  amountsForm, methodForm, confirmForm, unitsForm,
  singleTotalForm, singleTotalSchema,
  quantitiesForm, quantitiesSchema,
  meterDetailsForm, meterDetailsSchema,
  meterUnitsForm, meterReadingsForm, meterReadingsSchema,
  meterResetForm, meterUsedForm, meterUsedSchema
} = require('../forms');

const {
  applySingleTotal, applyQuantities,
  applyNilReturn, applyMeterDetails,
  applyMeterUnits, applyMeterReadings, applyMethodExternal,
  getLinesWithReadings, applyStatus, applyUnderQuery,
  applyMeterReset, checkMeterDetails, applyReadingType,
  applyMultiplication
} = require('../lib/return-helpers');

const permissions = require('../../../lib/permissions');

const flowHelpers = require('../lib/flow-helpers');

const sessionHelpers = require('../lib/session-helpers');

const helpers = require('../lib/helpers');

/**
 * Render form to display whether amounts / nil return for this cycle
 * @param {String} request.query.returnId - the return to edit
 */
const getAmounts = async (request, h) => {
  const { view, data } = request.returns;

  const form = forms.setValues(amountsForm(request), data);

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
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_START, request, data)
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
      updated = checkMeterDetails(updated);
      if (permissions.isInternal(request)) {
        updated = applyUnderQuery(updated, forms.getValues(form));
      }
      await sessionHelpers.submitReturnData(updated, request);
      return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_NIL_RETURN, request, data));
    } catch (error) {
      logger.errorWithJourney('Post confirm return error', error, request);
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
  const { data, view } = request.returns;

  // Clear session
  sessionHelpers.deleteSessionData(request);

  const returnUrl = `/returns/return?id=${data.returnId}`;

  return h.view('nunjucks/returns/submitted.njk', {
    ...view,
    return: data,
    returnUrl,
    pageTitle: `Abstraction return - ${data.isNil ? 'nil ' : ''}submitted`
  }, { layout: false });
};

/**
 * Routing question -
 * whether user is submitting meter readings or other
 */
const getMethod = async (request, h) => {
  const { data, view } = request.returns;
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
    const d = applyMethodExternal(data, method);
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METHOD, request, d));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METHOD, request, data)
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
    set(data, 'reading.units', units);
    sessionHelpers.saveSessionData(request, data);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_UNITS, request, data));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_UNITS, request, data)
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
    const updatedData = applySingleTotal(data, forms.getValues(form));
    sessionHelpers.saveSessionData(request, updatedData);
    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_SINGLE_TOTAL, request, updatedData));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_SINGLE_TOTAL, request, data)
  }, { layout: false });
};

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
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_QUANTITIES, request, data)
  }, { layout: false });
};

/**
 * Confirm screen for user to check amounts before submission
 */
const getConfirm = async (request, h) => {
  const { view } = request.returns;
  const data = applyMultiplication(request.returns.data);
  const lines = getLinesWithReadings(data);
  const form = confirmForm(request, data, `/return/confirm`);

  const isReadings = get(data, 'reading.method') === 'oneMeter';

  return h.view('nunjucks/returns/confirm.njk', {
    ...view,
    return: data,
    lines,
    form,
    total: helpers.getReturnTotal(data),
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_CONFIRM, request, data),
    makeChangePath: flowHelpers.getPath(isReadings ? flowHelpers.STEP_METER_READINGS : flowHelpers.STEP_QUANTITIES, request, data),
    endReading: get(data, `meters[0].readings.${helpers.endReadingKey(data)}`)
  }, { layout: false });
};

const getMeterDetails = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: meterDetailsForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_DETAILS, request, data)
  }, { layout: false });
};

const postMeterDetails = async (request, h) => {
  const { view, data } = request.returns;
  const form = forms.handleRequest(meterDetailsForm(request, data), request, meterDetailsSchema(data));

  if (form.isValid) {
    const d = applyMeterDetails(data, forms.getValues(form));
    sessionHelpers.saveSessionData(request, d);

    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METER_DETAILS, request, d));
  }

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_DETAILS, request, data)
  }, { layout: false });
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
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_UNITS, request, data)
  }, { layout: false });
};

const getMeterReset = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('nunjucks/returns/meter-reset.njk', {
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

  return h.view('nunjucks/returns/meter-reset.njk', {
    ...view,
    form,
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_RESET, request, data)
  }, { layout: false });
};

const getMeterReadings = async (request, h) => {
  const { view, data } = request.returns;

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form: meterReadingsForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_READINGS, request, data)
  }, { layout: false });
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

  return h.view('nunjucks/returns/form.njk', {
    ...view,
    form,
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_READINGS, request, data)
  }, { layout: false });
};

/**
 * Displays a screen for internal user to specify whether meter was used.
 * This disambiguates estimated/measured when volumes but no meter details
 * provided
 */
const getMeterUsed = (request, h) => {
  const { view, data } = request.returns;

  return h.view('water/returns/internal/form', {
    ...view,
    form: meterUsedForm(request, data),
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_USED, request, data)
  });
};

/**
 * Post handler for internal user to specify whether meter was used.
 */
const postMeterUsed = (request, h) => {
  const { view, data } = request.returns;
  const form = forms.handleRequest(meterUsedForm(request, data), request, meterUsedSchema);

  if (form.isValid) {
    const { meterUsed } = forms.getValues(form);
    const d = applyReadingType(data, meterUsed ? 'measured' : 'estimated');
    sessionHelpers.saveSessionData(request, d);
    return h.redirect(flowHelpers.getNextPath(flowHelpers.STEP_METER_USED, request, d));
  }

  return h.view('water/returns/internal/form', {
    ...view,
    form,
    return: data,
    back: flowHelpers.getPreviousPath(flowHelpers.STEP_METER_USED, request, data)
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
  postMeterReadings,
  getMeterUsed,
  postMeterUsed
};
