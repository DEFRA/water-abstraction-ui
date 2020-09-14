'use strict';

const urlJoin = require('url-join');
const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');

const options = [
  { value: 'sid', label: 'Spray irrigation direct' },
  { value: 'sido', label: 'Spray irrigation definition order' },
  { value: 'sis', label: 'Spray irrigation storage' }
];

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId, elementId } = request.params;
  const action = urlJoin('/licences/', licenceId, 'charge-information/charge-element', elementId, 'purpose');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('purpose', {
    errors: {
      'any.required': {
        message: 'Select a purpose use'
      }
    },
    choices: options
  }, sessionData.purpose || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    purpose: Joi.string().required()
  };
};

exports.schema = schema;

exports.form = form;
