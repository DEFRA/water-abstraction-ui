'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { has } = require('lodash');
const routing = require('../../lib/routing');
const { capitalize } = require('lodash');

const errors = {
  empty: {
    message: 'Enter a start and end date for the abstraction period'
  },
  invalidStart: {
    message: 'Enter a real start date'
  },
  invalidEnd: {
    message: 'Enter a real end date'
  }
};

const getFormField = (key, date) => {
  const name = capitalize(key);
  return fields.date(`${key}Date`, {
    label: `${name} Date`,
    subHeading: true,
    items: ['day', 'month'],
    type: 'date',
    mapper: 'dayOfYearMapper',
    errors: {
      'any.required': errors.empty,
      'any.empty': errors.empty,
      'string.isoDate': errors[`invalid${name}`],
      'date.isoDate': errors[`invalid${name}`],
      'date.base': errors[`invalid${name}`]
    }
  }, date);
};

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId } = request.params;
  const action = routing.getChargeElementStep(licenceId, 'abstraction');
  const startDate = has(sessionData, 'abstractionPeriod.startDay')
    ? `${sessionData.abstractionPeriod.startMonth}-${sessionData.abstractionPeriod.startDay}` : '';
  const endDate = has(sessionData, 'abstractionPeriod.endDay')
    ? `${sessionData.abstractionPeriod.endMonth}-${sessionData.abstractionPeriod.endDay}` : '';

  const f = formFactory(action, 'POST');
  f.fields.push(getFormField('start', startDate));
  f.fields.push(getFormField('end', endDate));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    startDate: Joi.date().raw().required(),
    endDate: Joi.date().required()
  };
};

exports.schema = schema;
exports.form = form;
