'use strict';

const routing = require('../../lib/routing');
const { has } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

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

const getDates = sessionData => {
  return (has(sessionData, 'timeLimitedPeriod.startDate'))
    ? sessionData.timeLimitedPeriod
    : { startDate: null, endDate: null };
};

/**
 * This method returns a date field - it is extracted to avoid code duplication
 * @param {string} key either start or end used to define the date field
 * @param {object} values session data to preload the form
 */
const getDateField = (key, sessionData) => {
  return fields.date(`${key}Date`, {
    label: `Enter ${key} date`,
    type: 'date',
    mapper: 'dateMapper',
    subHeading: true,
    errors: {
      'date.min': getError(key).beforeChargeStart,
      'date.max': getError(key).afterLicenceExpired,
      'any.required': getError(key).empty,
      'string.isoDate': getError(key).invalid,
      'date.isoDate': getError(key).invalid,
      'date.base': getError(key).invalid
    }
  }, getDates(sessionData)[key + 'Date']);
};

const options = (sessionData) => {
  return [
    {
      value: 'yes',
      label: 'Yes',
      fields: [ getDateField('start', sessionData), getDateField('end', sessionData) ]
    },
    { value: false, label: 'No' }
  ];
};

const getSelectedValue = sessionData => {
  if (!(has(sessionData, 'timeLimitedPeriod'))) {
    return '';
  } else {
    return !sessionData.timeLimitedPeriod ? false : 'yes';
  }
};

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { draftChargeData, licence } = request.pre;
  const action = routing.getChargeElementStep(licence.id, 'time');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('timeLimitedPeriod', {
    errors: {
      'any.required': {
        message: 'Select yes if you want to set a time limit. Select no to continue'
      }
    },
    choices: options(sessionData)
  }, getSelectedValue(sessionData)));
  f.fields.push(fields.hidden('chargeStartDate', {}, draftChargeData.startDate));
  f.fields.push(fields.hidden('expiredDate', {}, licence.expiredDate || '9999-01-01'));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    expiredDate: Joi.date().iso(),
    chargeStartDate: Joi.date().iso(),
    csrf_token: Joi.string().uuid().required(),
    timeLimitedPeriod: Joi.string().required().valid(['yes', false]),
    startDate: Joi.date().allow('').when('timeLimitedPeriod', {
      is: 'yes',
      then: Joi.date().iso().min(Joi.ref('chargeStartDate')).required()
    }),
    endDate: Joi.date().allow('').when('timeLimitedPeriod', {
      is: 'yes',
      then: Joi.date().iso().greater(Joi.ref('startDate')).max(Joi.ref('expiredDate')).required()
    })
  };
};

exports.schema = schema;
exports.form = form;
