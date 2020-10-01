'use strict';

const { has } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');
const { CHARGE_ELEMENT_STEPS } = require('../../lib/charge-elements/constants');
const { getChargeElementData, getChargeElementActionUrl } = require('../../lib/form-helpers');

/**
 * returns the errors for the start and end date form fields
 * @param {string} key start or end
 */
const getError = (key) => {
  return {
    invalid: {
      message: `Enter the ${key} date in the right format, for example 31 3 2018`
    },
    empty: {
      message: `Enter the ${key} date for the time limit`
    },
    beforeChargeStart: {
      message: 'Enter a start date on or after the charge information start date'
    },
    afterLicenceExpired: {
      message: 'Enter an end date that is on or before the licence end date'
    }
  };
};

const getDates = data => {
  return (has(data, 'timeLimitedPeriod.startDate'))
    ? data.timeLimitedPeriod
    : { startDate: null, endDate: null };
};

/**
 * This method returns a date field - it is extracted to avoid code duplication
 * @param {string} key either start or end used to define the date field
 * @param {object} values session data to preload the form
 */
const getDateField = (key, data) => {
  return fields.date(`${key}Date`, {
    label: `Enter ${key} date`,
    type: 'date',
    mapper: 'dateMapper',
    subHeading: true,
    errors: {
      'date.min': getError(key).beforeChargeStart,
      'date.max': getError(key).afterLicenceExpired,
      'any.required': getError(key).empty,
      'date.isoDate': getError(key).invalid,
      'date.base': getError(key).invalid
    }
  }, getDates(data)[key + 'Date']);
};

const options = (data) => {
  return [
    {
      value: 'yes',
      label: 'Yes',
      fields: [ getDateField('start', data), getDateField('end', data) ]
    },
    { value: 'no', label: 'No' }
  ];
};

const getSelectedValue = data => {
  if (!(has(data, 'timeLimitedPeriod'))) {
    return '';
  } else {
    return !data.timeLimitedPeriod ? 'no' : 'yes';
  }
};

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeElementData(request);
  const action = getChargeElementActionUrl(request, CHARGE_ELEMENT_STEPS.timeLimit);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('timeLimitedPeriod', {
    errors: {
      'any.required': {
        message: 'Select yes if you want to set a time limit. Select no to continue'
      }
    },
    choices: options(data)
  }, getSelectedValue(data)));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  const { startDate } = request.pre.draftChargeInformation.dateRange;
  const expiredDate = request.pre.licence.expiredDate || '9999-01-01';
  return {
    csrf_token: Joi.string().uuid().required(),
    timeLimitedPeriod: Joi.string().required().valid(['yes', 'no']),
    startDate: Joi.when('timeLimitedPeriod', {
      is: 'yes',
      then: Joi.date().iso().min(startDate)
    }),
    endDate: Joi.when('timeLimitedPeriod', {
      is: 'yes',
      then: Joi.date().iso().greater(startDate).max(expiredDate)
    })
  };
};

exports.schema = schema;
exports.form = form;
