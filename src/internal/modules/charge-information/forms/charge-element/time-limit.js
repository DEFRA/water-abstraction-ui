'use strict';

const urlJoin = require('url-join');
const { has } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

const startDateError = {
  message: 'Enter the start date in the right format, for example 31 3 2018'
};
const endDateError = {
  message: 'Enter the end date in the right format, for example 31 3 2018'
};

const options = dates => {
  return [
    {
      value: 'yes',
      label: 'Yes',
      fields: [
        fields.date('startDate', {
          label: 'Enter start date',
          type: 'date',
          mapper: 'dateMapper',
          subHeading: true,
          errors: {
            'any.required': startDateError,
            'string.isoDate': startDateError,
            'date.isoDate': startDateError,
            'date.base': startDateError
          }
        }, dates.startDate),
        fields.date('endDate', {
          label: 'Enter end date',
          type: 'date',
          mapper: 'dateMapper',
          subHeading: true,
          errors: {
            'any.required': endDateError,
            'string.isoDate': endDateError,
            'date.isoDate': endDateError,
            'date.base': endDateError,
            'date.ref': '',
            'date.greater': {
              message: 'Enter an end date after the start date'
            }
          }
        }, dates.endDate)
      ]
    },
    { value: 'no', label: 'No' }
  ];
};

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId, elementId } = request.params;
  const action = urlJoin('/licences/', licenceId, 'charge-information/charge-element', elementId, 'time');
  let selectedValue;
  if (!(has(sessionData, 'timeLimitedPeriod'))) {
    selectedValue = '';
  } else {
    selectedValue = sessionData.timeLimitedPeriod === 'no' ? 'no' : 'yes';
  }

  const dates = (has(sessionData, 'timeLimitedPeriod.startDate')) ? sessionData.timeLimitedPeriod : { startDate: null, endDate: null };

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('timeLimitedPeriod', {
    errors: {
      'any.required': {
        message: 'Set a time limit?'
      }
    },
    choices: options(dates)
  }, selectedValue));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    timeLimitedPeriod: Joi.string().required().allow(['yes', 'no']),
    startDate: Joi.when('timeLimitedPeriod', {
      is: 'yes',
      then: Joi.date().iso().required()
    }),
    endDate: Joi.when('timeLimitedPeriod', {
      is: 'yes',
      then: Joi.date().iso().greater(Joi.ref('startDate')).required()
    })
  };
};

exports.schema = schema;
exports.form = form;
