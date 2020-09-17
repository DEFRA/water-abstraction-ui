'use strict';

const routing = require('../../lib/routing');
const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { uniqBy } = require('lodash');

const options = defaultChargeData => {
  return uniqBy(defaultChargeData.map(row => {
    return { value: row.purposeUse.id, label: row.purposeUse.name };
  }), 'value');
};

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = (request, sessionData = {}, defaultChargeData = []) => {
  const { csrfToken } = request.view;
  const { licenceId } = request.params;
  const action = routing.getChargeElementStep(licenceId, 'purpose');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('purpose', {
    errors: {
      'any.required': {
        message: 'Select a purpose use'
      }
    },
    choices: options(defaultChargeData)
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
