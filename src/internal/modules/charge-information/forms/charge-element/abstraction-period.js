'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { capitalize, has } = require('lodash');
const { CHARGE_ELEMENT_STEPS } = require('../../lib/charge-elements/constants');
const { getChargeElementData, getChargeElementActionUrl } = require('../../lib/form-helpers');

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

const getSessionDates = (key, data) => {
  return has(data, `abstractionPeriod.${key}Day`)
    ? data.abstractionPeriod[`${key}Month`] + '-' + data.abstractionPeriod[`${key}Day`] : '';
};

/**
 * Form to request the abstraction period
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeElementData(request);
  const action = getChargeElementActionUrl(request, CHARGE_ELEMENT_STEPS.abstractionPeriod);

  const f = formFactory(action, 'POST');
  f.fields.push(getFormField('start', getSessionDates('start', data)));
  f.fields.push(getFormField('end', getSessionDates('end', data)));
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
