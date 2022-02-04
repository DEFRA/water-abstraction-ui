const Joi = require('joi');
const { get } = require('lodash');
const moment = require('moment');
const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');

const DATE_FORMAT = 'D MMMM YYYY';
const ISO_FORMAT = 'YYYY-MM-DD';

const MIN_LICENCE_START = 'licence_start';
const MIN_LICENCE_VERSION_START = 'licence_version_start';
const MIN_EARLIEST_LICENCE_VERSION = 'earliest_licence_version';
const MIN_5_YEARS = '5_years';

const createValues = (startDate, customDate) => ({ startDate, customDate });

/**
 * Gets values of form fields depending on current state
 * @param {Object} request
 * @param {Object} licence
 * @param {String} [refDate]
 * @return {Object}
 */
const getValues = (request, licence, refDate) => {
  const licenceVersionEffectiveDate = get(request.pre.licenceVersions.find(x => x.status === 'current'), 'startDate');
  const startDate = get(request, 'pre.draftChargeInformation.dateRange.startDate');
  if (!startDate) {
    return createValues();
  }
  if (startDate === moment(refDate).format(ISO_FORMAT)) {
    return createValues('today');
  }
  if (startDate === licenceVersionEffectiveDate) {
    return createValues('licenceVersionEffectiveDate');
  }
  return createValues('customDate', startDate);
};

const getDates = (licence, licenceVersions) => {
  const earliestLicenceVersionStartDate = moment.min(licenceVersions.map(x => moment(x.startDate)));
  const licenceVersionEffectiveDate = get(licenceVersions.find(x => x.status === 'current'), 'startDate');

  return {
    licenceVersionEffectiveDate,
    licenceStartDate: licence.startDate,
    licenceEndDate: licence.endDate,
    earliestLicenceVersionStartDate: earliestLicenceVersionStartDate.toDate(),
    minType: minErrors[MIN_EARLIEST_LICENCE_VERSION](earliestLicenceVersionStartDate.format('D MMMM YYYY')),
    maxDate: licence.endDate || '3000-01-01'
  };
};

const minErrors = {
  [MIN_LICENCE_START]: 'You must enter a date on or after the licence start date',
  [MIN_LICENCE_VERSION_START]: 'You must enter a date on or after the licence version start date',
  [MIN_5_YEARS]: 'Date must be today or up to five years\' in the past',
  [MIN_EARLIEST_LICENCE_VERSION]: (d) => `Date must be after the start date of the earliest known licence version (${d})`
};

const getCommomCustomDateErrors = dates => ({
  'date.min': {
    message: dates.minType
  },
  'date.max': {
    message: 'You must enter a date before the licence end date'
  },
  'date.custom': {
    message: 'Enter a real date'
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
  const options = [
    {
      value: 'licenceVersionEffectiveDate',
      label: 'Licence version start date',
      hint: moment(dates.licenceVersionEffectiveDate).format(DATE_FORMAT)
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

  if (moment(dates.licenceStartDate).isBefore() && (!dates.licenceEndDate || moment(dates.licenceEndDate).isAfter())) {
    options.unshift({
      value: 'today',
      label: 'Today',
      hint: moment(refDate).format(DATE_FORMAT)
    });
  }

  return options;
};

/**
 *
 * @param {*} request
 * @param {String} [refDate] - a reference date used in unit testing
 */
const selectStartDateForm = (request, refDate) => {
  const { csrfToken } = request.view;
  const { licence, licenceVersions, isChargeable } = request.pre;
  const { chargeVersionWorkflowId, returnToCheckData } = request.query;

  const values = getValues(request, licence, refDate);

  const action = isChargeable
    ? routing.getStartDate(licence.id, { chargeVersionWorkflowId, returnToCheckData })
    : routing.getEffectiveDate(licence.id, { chargeVersionWorkflowId, returnToCheckData });

  const errorMessage = isChargeable
    ? 'Select charge information start date'
    : 'Select effective date';

  const dates = getDates(licence, licenceVersions);

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
  const { licence, licenceVersions } = request.pre;
  const dates = getDates(licence, licenceVersions);

  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    startDate: Joi.string().valid('today', 'licenceVersionEffectiveDate', 'customDate').required(),
    customDate: Joi.when('startDate', {
      is: 'customDate',
      then: Joi.date().min(dates.earliestLicenceVersionStartDate).max(dates.maxDate).required()
        .custom((value, helper) => {
          const { error, original } = helper;
          if (moment(original).isValid()) {
            return value;
          }
          return error('date.custom');
        })
    })
  });
};

exports.form = selectStartDateForm;
exports.schema = selectStartDateSchema;
