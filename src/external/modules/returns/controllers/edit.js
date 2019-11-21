/**
 * Controller to allow returns users to submit/edit returns data
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
const { addQuery, errorRedirect } = require('shared/modules/returns/route-helpers');
const { mapLines, mapMeterDetails } = require('shared/modules/returns/form-mappers');

/**
 * Renders form for "Have you abstracted water in this return period?"
 */
const getAmounts = async (request, h) => h.view('nunjucks/returns/form', {
  ...request.view,
  back: STEP_RETURNS
});

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
  return errorRedirect(request, h, STEP_START);
};

/**
 * Get handler for method (meter/volumes/estimates)
 */
const getMethod = async (request, h) => h.view('nunjucks/returns/form', {
  ...request.view,
  back: addQuery(request,
    request.model.reading.isOneMeter() ? STEP_METER_RESET : STEP_UNITS
  )
});

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
  return errorRedirect(request, h, STEP_METHOD);
};

/**
 * Get handler for units
 */
const getUnits = async (request, h) => h.view('nunjucks/returns/form', {
  ...request.view,
  back: addQuery(request,
    request.model.reading.isOneMeter() ? STEP_METER_RESET : STEP_METHOD
  )
});

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
  return errorRedirect(request, h, STEP_UNITS);
};

/**
 * GET - volumes
 */
const getQuantities = async (request, h) => h.view('nunjucks/returns/form', {
  ...request.view,
  back: addQuery(request, STEP_UNITS)
});

/**
 * POST - volumes
 */
const postQuantities = async (request, h) => {
  if (request.view.form.isValid) {
    const data = omit(forms.getValues(request.view.form), 'csrf_token');
    request.model.setLines(mapLines(data));

    const path = addQuery(request, request.model.reading.isMeasured() ? STEP_METER_DETAILS : STEP_CONFIRM);
    return h.redirect(path);
  }
  return errorRedirect(request, h, STEP_QUANTITIES);
};

/**
 * Get meter details
 */
const getMeterDetails = async (request, h) => h.view('nunjucks/returns/form', {
  ...request.view,
  back: addQuery(request, request.model.reading.isOneMeter() ? STEP_METER_READINGS : STEP_QUANTITIES)
});

/**
 * POST handler for meter details page
 */
const postMeterDetails = async (request, h) => {
  if (request.view.form.isValid) {
    const values = forms.getValues(request.view.form);
    const details = mapMeterDetails(values);
    request.model.meter.setMeterDetails(details);
    return h.redirect(addQuery(request, STEP_CONFIRM));
  }
  return errorRedirect(request, h, STEP_METER_DETAILS);
};

const getConfirmBackPath = request => {
  let path;
  if (request.model.isNilReturn()) {
    path = STEP_START;
  } else {
    path = request.model.reading.isMeasured()
      ? STEP_METER_DETAILS
      : STEP_QUANTITIES;
  }
  return addQuery(request, path);
};

/**
 * GET handler for confirm return
 */
const getConfirm = async (request, h) => {
  const { model } = request;
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

  return h.view('nunjucks/returns/confirm', view);
};

/**
 * POST handler for confirm return
 */
const postConfirm = async (request, h) => {
  if (request.view.form.isValid) {
    request.model
      .setUser(request.defra.userName, request.defra.entityId, false)
      .setStatus(STATUS_COMPLETED)
      .setReceivedDate()
      .incrementVersionNumber();

    return h.redirect(addQuery(request, STEP_SUBMITTED));
  }
  return errorRedirect(request, h, STEP_CONFIRM);
};

/**
 * Has the meter reset within this return cycle?  If so the user will have
 * to do the volumes route since meter reset is not currently supported
 */
const getMeterReset = async (request, h) => h.view('nunjucks/returns/form', {
  ...request.view,
  back: addQuery(request, STEP_METHOD)
});

/**
 * POST handler for meter reset
 */
const postMeterReset = async (request, h) => {
  if (request.view.form.isValid) {
    const { meterReset } = forms.getValues(request.view.form);
    request.model.reading.setMethod(meterReset ? METHOD_VOLUMES : METHOD_ONE_METER);
    return h.redirect(addQuery(request, STEP_UNITS));
  }
  return errorRedirect(request, h, STEP_METER_RESET);
};

/**
 * GET form for meter readings
 */
const getMeterReadings = async (request, h) => h.view('nunjucks/returns/form', {
  ...request.view,
  back: addQuery(request, STEP_UNITS)
});

/**
 * POST form for meter readings
 */
const postMeterReadings = async (request, h) => {
  if (request.view.form.isValid) {
    const data = omit(forms.getValues(request.view.form), ['csrf_token', 'startReading']);
    const lines = mapLines(data, 'reading');
    const { startReading } = forms.getValues(request.view.form);
    request.model.meter.setMeterReadings(startReading, lines);
    return h.redirect(addQuery(request, STEP_METER_DETAILS));
  }
  return errorRedirect(request, h, STEP_METER_READINGS);
};

/**
 * Return submitted page
 * @todo show licence name if available
 * @todo link to view return
 */
const getSubmitted = async (request, h) => {
  const data = await services.water.returns.getReturn(request.query.returnId);

  const returnUrl = `/returns/return?id=${data.returnId}`;

  return h.view('nunjucks/returns/submitted', {
    ...request.view,
    data,
    returnUrl,
    pageTitle: `Abstraction return - ${data.isNil ? 'nil ' : ''}submitted`
  });
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
