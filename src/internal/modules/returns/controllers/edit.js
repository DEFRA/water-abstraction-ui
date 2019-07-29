/**
 * Controller to allow internal colleagues to submit/edit returns data
 * @todo - ensure the user cannot edit/submit a completed return
 * @todo - ensure session data is valid at every step
 */
const { omit, get } = require('lodash');
const moment = require('moment');

const services = require('internal/lib/connectors/services');
const forms = require('shared/lib/forms');

const { STEP_INTERNAL_ROUTING, STEP_DATE_RECEIVED, STEP_START,
  STEP_CONFIRM, STEP_METHOD, STEP_UNITS, STEP_METER_READINGS, STEP_QUANTITIES,
  STEP_METER_DETAILS_PROVIDED, STEP_SUBMITTED, STEP_METER_DETAILS,
  STEP_METER_USED, STEP_SINGLE_TOTAL, STEP_SINGLE_TOTAL_DATES
} = require('shared/modules/returns/steps');

const { STATUS_COMPLETED } = require('shared/modules/returns/models/WaterReturn');
const {
  READING_TYPE_ESTIMATED, READING_TYPE_MEASURED
} = require('shared/modules/returns/models/Reading');

const { addQuery } = require('shared/modules/returns/route-helpers');
const { mapLines, mapMeterDetails } = require('shared/modules/returns/form-mappers');

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * GET - date received
 */
const getDateReceived = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_INTERNAL_ROUTING)
}, { layout: false });

/**
 * POST - date received
 */
const postDateReceived = async (request, h) => {
  if (request.view.form.isValid) {
    const { receivedDate, customDate } = forms.getValues(request.view.form);
    const dates = {
      today: moment(),
      yesterday: moment().subtract(1, 'day'),
      custom: moment(customDate)
    };
    request.model.setReceivedDate(dates[receivedDate].format(DATE_FORMAT));

    return h.redirect(addQuery(request, STEP_START));
  }
  return getDateReceived(request, h);
};

/**
 * GET - was water abstracted?
 */
const getAmounts = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_DATE_RECEIVED)
}, { layout: false });

/**
 * POST - was water abstracted?
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
 * GET - method volumes/meter
 */
const getMethod = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_START)
}, { layout: false });

/**
 * POST - method volumes/meter
 */
const postMethod = async (request, h) => {
  if (request.view.form.isValid) {
    const { method } = forms.getValues(request.view.form);
    request.model.reading.setMethod(method);
    return h.redirect(addQuery(request, STEP_UNITS));
  }
  return getMethod(request, h);
};

/**
 * GET - units
 */
const getUnits = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_METHOD)
}, { layout: false });

/**
 * POST - units
 */
const postUnits = async (request, h) => {
  if (request.view.form.isValid) {
    const { units } = forms.getValues(request.view.form);
    request.model.reading.setUnits(units);
    const path = addQuery(request, STEP_METER_DETAILS_PROVIDED);
    return h.redirect(path);
  }
  return getUnits(request, h);
};

/**
 * GET - meter details provided
 */
const getMeterDetailsProvided = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_UNITS)
}, { layout: false });

/**
 * POST - meter details provided
 */
const postMeterDetailsProvided = async (request, h) => {
  if (request.view.form.isValid) {
    const { meterDetailsProvided } = forms.getValues(request.view.form);
    request.model.meter.setMeterDetailsProvided(meterDetailsProvided);

    // Calculate next page in flow
    let next;
    if (meterDetailsProvided) {
      next = STEP_METER_DETAILS;
    } else if (request.model.reading.isVolumes()) {
      next = STEP_METER_USED;
    } else {
      next = STEP_METER_READINGS;
    }

    return h.redirect(addQuery(request, next));
  }
  return getMeterDetailsProvided(request, h);
};

/**
 * Get meter details
 */
const getMeterDetails = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_METER_DETAILS_PROVIDED)
}, { layout: false });

/**
 * POST handler for meter details page
 */
const postMeterDetails = async (request, h) => {
  if (request.view.form.isValid) {
    const data = forms.getValues(request.view.form);
    const details = mapMeterDetails(data);
    request.model.meter.setMeterDetails(details);
    const next = request.model.reading.isOneMeter() ? STEP_METER_READINGS : STEP_SINGLE_TOTAL;
    return h.redirect(addQuery(request, next));
  }
  return getMeterDetails(request, h);
};

/**
 * GET - meter used
 */
const getMeterUsed = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_METER_DETAILS_PROVIDED)
}, { layout: false });

/**
 * POST - meter used
 */
const postMeterUsed = async (request, h) => {
  if (request.view.form.isValid) {
    const { meterUsed } = forms.getValues(request.view.form);

    const type = meterUsed ? READING_TYPE_MEASURED : READING_TYPE_ESTIMATED;
    request.model.reading.setReadingType(type);

    return h.redirect(addQuery(request, STEP_SINGLE_TOTAL));
  }
  return getMeterUsed(request, h);
};

/**
 * GET form for meter readings
 */
const getMeterReadings = async (request, h) => {
  const back = request.model.meter.isMeterDetailsProvided()
    ? STEP_METER_DETAILS
    : STEP_METER_DETAILS_PROVIDED;
  return h.view('nunjucks/returns/form.njk', {
    ...request.view,
    back: addQuery(request, back)
  }, { layout: false });
};

/**
 * POST form for meter readings
 */
const postMeterReadings = async (request, h) => {
  if (request.view.form.isValid) {
    const data = omit(forms.getValues(request.view.form), ['csrf_token', 'startReading']);
    const lines = mapLines(data, 'reading');
    const { startReading } = forms.getValues(request.view.form);
    request.model.meter.setMeterReadings(startReading, lines);
    return h.redirect(addQuery(request, STEP_CONFIRM));
  }
  return getMeterReadings(request, h);
};

/**
 * GET - single total
 */
const getSingleTotal = async (request, h) => {
  const path = request.model.meter.isMeterDetailsProvided()
    ? STEP_METER_DETAILS
    : STEP_METER_USED;
  return h.view('nunjucks/returns/form.njk', {
    ...request.view,
    back: addQuery(request, path)
  }, { layout: false });
};

/**
 * POST - single total
 */
const postSingleTotal = async (request, h) => {
  if (request.view.form.isValid) {
    const { isSingleTotal, total } = forms.getValues(request.view.form);
    request.model.reading.setSingleTotal(isSingleTotal, total);
    const path = isSingleTotal ? STEP_SINGLE_TOTAL_DATES : STEP_QUANTITIES;
    return h.redirect(addQuery(request, path));
  }
  return getSingleTotal(request, h);
};

/**
 * GET - single total abstraction period
 */
const getSingleTotalDates = async (request, h) => h.view('nunjucks/returns/form.njk', {
  ...request.view,
  back: addQuery(request, STEP_SINGLE_TOTAL)
}, { layout: false });

/**
 * POST - single total abstraction period
 */
const postSingleTotalDates = async (request, h) => {
  if (request.view.form.isValid) {
    const { totalCustomDates, totalCustomDateStart, totalCustomDateEnd } =
      forms.getValues(request.view.form);
    request.model.reading.setCustomAbstractionPeriod(
      totalCustomDates, totalCustomDateStart, totalCustomDateEnd
    );
    request.model.updateSingleTotalLines();
    return h.redirect(addQuery(request, STEP_QUANTITIES));
  }
  return getSingleTotalDates(request, h);
};

/**
 * GET - volumes
 */
const getQuantities = async (request, h) => {
  const path = request.model.reading.isSingleTotal()
    ? STEP_SINGLE_TOTAL_DATES
    : STEP_SINGLE_TOTAL;
  return h.view('nunjucks/returns/form.njk', {
    ...request.view,
    back: addQuery(request, path)
  }, { layout: false });
};

/**
 * POST - volumes
 */
const postQuantities = async (request, h) => {
  if (request.view.form.isValid) {
    const data = omit(forms.getValues(request.view.form), 'csrf_token');
    request.model.setLines(mapLines(data));
    return h.redirect(addQuery(request, STEP_CONFIRM));
  }
  return getAmounts(request, h);
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
    makeChangeText: `Edit these ${model.reading.isOneMeter() ? 'meter readings' : 'volumes'}`,
    makeChangePath: addQuery(request, path)
  };

  return h.view('nunjucks/returns/confirm.njk', view, { layout: false });
};

/**
 * POST handler for confirm return
 */
const postConfirm = async (request, h) => {
  if (request.view.form.isValid) {
    const values = forms.getValues(request.view.form);

    const isUnderQuery = get(values, 'isUnderQuery[0]') === 'under_query';

    request.model
      .setUser(request.defra.userName, request.defra.entityId, true)
      .setStatus(STATUS_COMPLETED)
      .setUnderQuery(isUnderQuery)
      .incrementVersionNumber();

    return h.redirect(addQuery(request, STEP_SUBMITTED));
  }
  return getConfirm(request, h);
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
  getDateReceived,
  postDateReceived,
  getAmounts,
  postAmounts,
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
  getMeterReadings,
  postMeterReadings,
  getMeterDetailsProvided,
  postMeterDetailsProvided,
  getMeterUsed,
  postMeterUsed,
  getSingleTotalDates,
  postSingleTotalDates
};
