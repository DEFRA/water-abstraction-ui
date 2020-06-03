const Joi = require('@hapi/joi');
const { get } = require('lodash');
const moment = require('moment');
const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');

const DATE_FORMAT = 'D MMMM YYYY';
const ISO_FORMAT = 'YYYY-MM-DD';

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

const dateError = {
  message: 'Enter a date in the right format, for example 31 3 2018',
  summary: 'Enter a date in the right format'
};

const getCustomDateField = value => fields.date('customDate', {
  label: 'Start date',
  errors: {
    'any.required': dateError,
    'string.isoDate': dateError,
    'date.isoDate': dateError,
    'date.base': dateError,
    'date.min': {
      message: 'Enter a date on or after the licence start date'
    },
    'date.max': {
      message: 'Enter a date on or before the licence end date'
    }
  }
}, value);

/**
 *
 * @param {*} request
 * @param {String} [refDate] - a reference date used in unit testing
 */
const selectStartDateForm = (request, refDate) => {
  const { csrfToken } = request.view;
  const { licence } = request.pre;

  const action = routing.getStartDate(licence);
  const values = getValues(request, licence, refDate);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('startDate', {
    errors: {
      'any.required': {
        message: 'Select a start date'
      }
    },
    choices: [{
      value: 'today',
      label: 'Today',
      hint: moment(refDate).format(DATE_FORMAT)
    }, {
      value: 'licenceStartDate',
      label: 'Licence start date',
      hint: moment(licence.startDate).format(DATE_FORMAT)
    },
    {
      divider: 'or'
    },
    {
      value: 'customDate',
      label: 'Another date',
      fields: [
        getCustomDateField(values.customDate)
      ]
    }]
  }, values.startDate));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectStartDateSchema = (request) => {
  const { startDate, endDate } = request.pre.licence;
  const maxDate = endDate || '3000-01-01';
  return {
    csrf_token: Joi.string().uuid().required(),
    startDate: Joi.string().valid('today', 'licenceStartDate', 'customDate').required(),
    customDate: Joi.when('startDate', {
      is: 'customDate',
      then: Joi.date().min(startDate).max(maxDate)
    })
  };
};

exports.form = selectStartDateForm;
exports.schema = selectStartDateSchema;
