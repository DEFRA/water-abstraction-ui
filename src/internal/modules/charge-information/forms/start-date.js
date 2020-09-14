const Joi = require('@hapi/joi');
const { get, pullAt } = require('lodash');
const moment = require('moment');
const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');

const DATE_FORMAT = 'D MMMM YYYY';
const ISO_FORMAT = 'YYYY-MM-DD';

const MIN_LICENCE_START = 'licence_start';
const MIN_6_YEARS = '6_years';

const createValues = (startDate, customDate) => ({ startDate, customDate });

/**
 * Gets values of form fields depending on current state
 * @param {Object} request
 * @param {Object} licence
 * @param {String} [refDate]
 * @return {Object}
 */
const getValues = (request, licence, refDate) => {
  const startDate = get(request, 'pre.draftChargeInformation.startDate');
  if (!startDate) {
    return createValues();
  }
  if (startDate === moment(refDate).format(ISO_FORMAT)) {
    return createValues('today');
  }
  if (startDate === licence.startDate) {
    return createValues('licenceStartDate');
  }
  return createValues('customDate', startDate);
};

const getDates = licence => {
  const startDate = moment(licence.startDate);
  const minDate = moment().subtract(6, 'years');
  const isLicenceStart = startDate.isAfter(minDate);
  return {
    licenceStartDate: licence.startDate,
    minDate: isLicenceStart ? licence.startDate : minDate.format(ISO_FORMAT),
    minType: isLicenceStart ? MIN_LICENCE_START : MIN_6_YEARS,
    maxDate: licence.endDate || '3000-01-01'
  };
};

const minErrors = {
  [MIN_LICENCE_START]: 'You must enter a date after the licence start date',
  [MIN_6_YEARS]: "Date must be today or up to six years' in the past"
};

const getCommomCustomDateErrors = dates => ({
  'date.min': {
    message: minErrors[dates.minType]
  },
  'date.max': {
    message: 'You must enter a date before the licence end date'
  }
});

const getStartDateCustomDataErrors = dates => ({
  'any.required': {
    message: 'Enter the charge information start date'
  },
  'date.base': {
    message: 'Enter a real date for the charge information start date'
  },
  ...getCommomCustomDateErrors(dates)
});

const getEffectiveDateCustomDataErrors = dates => ({
  'any.required': {
    message: 'Enter the effective date'
  },
  'date.base': {
    message: 'Enter a real date for the effective date'
  },
  ...getCommomCustomDateErrors(dates)
});

const getCustomStartDateField = (dates, value) => fields.date('customDate', {
  label: 'Start date',
  errors: getStartDateCustomDataErrors(dates)
}, value);

const getCustomEffectiveDateField = (dates, value) => fields.date('customDate', {
  label: 'Effective date',
  errors: getEffectiveDateCustomDataErrors(dates)
}, value);

const getChoices = (dates, values, refDate, isChargeable) => {
  const allChoices = [{
    value: 'today',
    label: 'Today',
    hint: moment(refDate).format(DATE_FORMAT)
  }, {
    value: 'licenceStartDate',
    label: 'Licence start date',
    hint: moment(dates.licenceStartDate).format(DATE_FORMAT)
  },
  {
    divider: 'or'
  },
  {
    value: 'customDate',
    label: 'Another date',
    fields: [
      isChargeable
        ? getCustomStartDateField(dates, values.customDate)
        : getCustomEffectiveDateField(dates, values.customDate)
    ]
  }];

  return dates.minType === MIN_LICENCE_START ? allChoices : pullAt(allChoices, [0, 3]);
};

/**
 *
 * @param {*} request
 * @param {String} [refDate] - a reference date used in unit testing
 */
const selectStartDateForm = (request, refDate) => {
  const { csrfToken } = request.view;
  const { licence, isChargeable } = request.pre;

  const action = isChargeable
    ? routing.getStartDate(licence)
    : routing.getEffectiveDate(licence);

  const errorMessage = isChargeable
    ? 'Select charge information start date'
    : 'Select effective date';

  const values = getValues(request, licence, refDate);
  const dates = getDates(licence);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('startDate', {
    errors: {
      'any.required': {
        message: errorMessage
      }
    },
    choices: getChoices(dates, values, refDate, isChargeable)
  }, values.startDate));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectStartDateSchema = (request) => {
  const { licence } = request.pre;
  const dates = getDates(licence);

  return {
    csrf_token: Joi.string().uuid().required(),
    startDate: Joi.string().valid('today', 'licenceStartDate', 'customDate').required(),
    customDate: Joi.when('startDate', {
      is: 'customDate',
      then: Joi.date().min(dates.minDate).max(dates.maxDate)
    })
  };
};

exports.form = selectStartDateForm;
exports.schema = selectStartDateSchema;
