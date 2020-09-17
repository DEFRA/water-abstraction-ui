'use strict';

const routing = require('../../lib/routing');
const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');

const options = [
  { value: 'unsupported', label: 'Unsupported' },
  { value: 'supported', label: 'Supported' },
  { value: 'tidal', label: 'Tidal' },
  { value: 'kielder', label: 'Kielder' }
];

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId } = request.params;
  const action = routing.getChargeElementStep(licenceId, 'source');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('source', {
    errors: {
      'any.required': {
        message: 'Select source'
      }
    },
    choices: options
  }, sessionData.source || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    source: Joi.string().required().allow(['unsupported', 'supported', 'tidal', 'kielder'])
  };
};

exports.schema = schema;

exports.form = form;
