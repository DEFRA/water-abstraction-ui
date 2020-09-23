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
 * Form to request the charge element source
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId, elementId } = request.params;
  const action = routing.getChargeElementStep(licenceId, elementId, 'source');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('source', {
    errors: {
      'any.required': {
        message: 'Select a source'
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
    source: Joi.string().required().valid(['unsupported', 'supported', 'tidal', 'kielder'])
  };
};

exports.schema = schema;

exports.form = form;
