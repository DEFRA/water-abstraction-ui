/**
 * Controller to allow internal colleagues to submit/edit returns data
 * @todo - ensure the user cannot edit/submit a completed return
 * @todo - ensure session data is valid at every step
 */
const { omit } = require('lodash');
const forms = require('shared/lib/forms');
const { STEP_START, STEP_RETURNS, STEP_METHOD, STEP_METER_RESET, STEP_UNITS,
  STEP_QUANTITIES, STEP_METER_READINGS, STEP_METER_DETAILS, STEP_CONFIRM,
  STEP_SUBMITTED } = require('shared/modules/returns/steps');
const { STATUS_COMPLETED } = require('shared/modules/returns/models/WaterReturn');
const { METHOD_VOLUMES, METHOD_ONE_METER } = require('shared/modules/returns/models/Reading');

const services = require('../../../lib/connectors/services');

/**
 * Adds return ID query string from request.query.returnId to supplied path
 * @param {Object} request
 * @param {String} path
 */
const addQuery = (request, path) => {
  return `${path}?returnId=${request.query.returnId}`;
};

/**
 * Renders form for "Have you abstracted water in this return period?"
 */
const getAmounts = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: STEP_RETURNS
}, { layout: false });

/**
 * Post handler for "Have you abstracted water in this return period?"
 */
const postAmounts = async (request, h) => {
  if (request.view.form.isValid) {
    const { isNil } = forms.getValues(request.view.form);
    request.model.setNilReturn(isNil);
    const path = addQuery(request,
      request.model.isNilReturn() ? STEP_CONFIRM : STEP_METHOD
    );
    return h.redirect(path);
  }
  return getAmounts(request, h);
};

/**
 * Get handler for method (meter/volumes/estimates)
 */
const getMethod = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request,
    request.model.reading.isOneMeter() ? STEP_METER_RESET : STEP_UNITS
  )
}, { layout: false });

/**
 * Post handler for "Have you abstracted water in this return period?"
 */
const postMethod = async (request, h) => {
  if (request.view.form.isValid) {
    const { method } = forms.getValues(request.view.form);
    const [readingMethod, readingType] = method.split(',');

    request.model.reading
      .setMethod(readingMethod)
      .setReadingType(readingType);

    const path = addQuery(request,
      request.model.reading.isOneMeter() ? STEP_METER_RESET : STEP_UNITS
    );
    return h.redirect(path);
  }
  return getAmounts(request, h);
};

/**
 * Get handler for units
 */
const getUnits = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request,
    request.model.reading.isOneMeter() ? STEP_METER_RESET : STEP_METHOD
  )
}, { layout: false });

/**
 * Post handler for units
 */
const postUnits = async (request, h) => {
  if (request.view.form.isValid) {
    const { units } = forms.getValues(request.view.form);
    request.model.reading.setUnits(units);
    const path = addQuery(request, request.model.reading.isVolumes() ? STEP_QUANTITIES : STEP_METER_READINGS);
    return h.redirect(path);
  }
  return getAmounts(request, h);
};

/**
 * Get handler for units
 */
const getQuantities = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_UNITS)
}, { layout: false });

const getLines = (data, valueKey = 'quantity') => {
  return Object.keys(data).map(key => {
    const [startDate, endDate] = key.split('_');
    return { startDate, endDate, [valueKey]: data[key] };
  });
};

/**
 * Post handler for units
 */
const postQuantities = async (request, h) => {
  if (request.view.form.isValid) {
    const data = omit(forms.getValues(request.view.form), 'csrf_token');
    request.model.setLines(getLines(data));

    const path = addQuery(request, request.model.reading.isMeasured() ? STEP_METER_DETAILS : STEP_CONFIRM);
    return h.redirect(path);
  }
  return getAmounts(request, h);
};

/**
 * Get meter details
 */
const getMeterDetails = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, request.model.reading.isOneMeter() ? STEP_METER_READINGS : STEP_QUANTITIES)
}, { layout: false });

/**
 * POST handler for meter details page
 */
const postMeterDetails = async (request, h) => {
  if (request.view.form.isValid) {
    const { manufacturer, serialNumber, isMultiplier } = forms.getValues(request.view.form);
    const multiplier = (isMultiplier || []).includes('multiply') ? 10 : 1;
    request.model.meter.setMeterDetails({
      manufacturer,
      serialNumber,
      multiplier
    });
    return h.redirect(addQuery(request, STEP_CONFIRM));
  }
  return getMeterDetails(request, h);
};

const getConfirmBackPath = request => {
  let path;
  if (request.model.isNilReturn()) {
    path = STEP_START;
  } else if (request.model.reading.isMeasured()) {
    path = STEP_METER_DETAILS;
  } else path = request.model.reading.isVolumes() ? STEP_QUANTITIES : STEP_METER_READINGS;
  return addQuery(request, path);
};

/**
 * GET handler for confirm return
 */
const getConfirm = async (request, h) => {
  const { model } = request;
  // model.applyMeterMultiplication();
  const path = model.reading.isOneMeter() ? STEP_METER_READINGS : STEP_QUANTITIES;
  const view = {
    ...request.view,
    lines: model.getLines(true),
    back: getConfirmBackPath(request),
    total: model.getReturnTotal(),
    endReading: model.meter.getEndReading(),
    makeChangeText: `Edit your ${model.reading.isOneMeter() ? 'meter readings' : 'volumes'}`,
    makeChangePath: addQuery(request, path)
  };

  return h.view('nunjucks/returns/confirm.njk', view, { layout: false });
};

/**
 * POST handler for confirm return
 */
const postConfirm = async (request, h) => {
  if (request.view.form.isValid) {
    request.model
      .setUser(request.defra.userName, request.defra.entityId, false)
      .setStatus(STATUS_COMPLETED)
      .incrementVersionNumber();

    return h.redirect(addQuery(request, STEP_SUBMITTED));
  }
  return getConfirm(request, h);
};

/**
 * Has the meter reset within this return cycle?  If so the user will have
 * to do the volumes route since meter reset is not currently supported
 */
const getMeterReset = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_METHOD)
}, { layout: false });

/**
 * POST handler for meter reset
 */
const postMeterReset = async (request, h) => {
  if (request.view.form.isValid) {
    const { meterReset } = forms.getValues(request.view.form);
    request.model.reading.setMethod(meterReset ? METHOD_VOLUMES : METHOD_ONE_METER);
    return h.redirect(addQuery(request, STEP_UNITS));
  }
  return getMeterReset(request, h);
};

/**
 * GET form for meter readings
 */
const getMeterReadings = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_UNITS)
}, { layout: false });

/**
 * POST form for meter readings
 */
const postMeterReadings = async (request, h) => {
  if (request.view.form.isValid) {
    const data = omit(forms.getValues(request.view.form), ['csrf_token', 'startReading']);
    const lines = getLines(data, 'reading');
    const { startReading } = forms.getValues(request.view.form);
    request.model.meter.setMeterReadings(startReading, lines);
    return h.redirect(addQuery(request, STEP_METER_DETAILS));
  }
  return getMeterReadings(request, h);
};

/**
 * Return submitted page
 * @todo show licence name if available
 * @todo link to view return
 */
const getSubmitted = async (request, h) => {
  const data = await services.water.returns.getReturn(request.query.returnId);

  const returnUrl = `/returns/return?id=${data.returnId}`;

  return h.view('nunjucks/returns/submitted.njk', {
    ...request.view,
    data,
    returnUrl,
    pageTitle: `Abstraction return - ${data.isNil ? 'nil ' : ''}submitted`
  }, { layout: false });
};

module.exports = {
  getAmounts,
  postAmounts,
  getMethod,
  postMethod,
  getUnits,
  postUnits,
  getQuantities,
  postQuantities,
  getConfirm,
  postConfirm,
  getMeterDetails,
  postMeterDetails,
  getMeterReset,
  postMeterReset,
  getMeterReadings,
  postMeterReadings,
  getSubmitted
};
