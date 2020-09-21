'use strict';

const routing = require('../../lib/routing');
const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');

const options = [
  // @TODO the defaul season needs to be calculated once the abstrcation helpers has been updated.
  { value: 'summer', label: 'Summer', hint: 'This is the default season for the abstraction period set' },
  { value: 'winter', label: 'Winter' },
  { value: 'all year', label: 'All year' }
];

/**
 * Form to request the charge element description
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId } = request.params;
  const action = routing.getChargeElementStep(licenceId, 'season');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('season', {
    errors: {
      'any.required': {
        message: 'Select a season'
      }
    },
    choices: options
  }, sessionData.season));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    season: Joi.string().required().valid(['summer', 'winter', 'all year'])
  };
};

exports.schema = schema;

exports.form = form;
