'use strict';

const urlJoin = require('url-join');
const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');

const options = (defaultChargeData, selectedPurpose) => {
  const defaultLoss = defaultChargeData.find(row => row.purposeUse.id === selectedPurpose);
  return [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'very low', label: 'Very low' }
  ].map((row) => {
    return row.value === defaultLoss.loss
      ? { ...row, hint: 'This is the default loss category for the purpose chosen' } : row;
  });
};

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = (request, sessionData = {}, defaultChargeData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId, elementId } = request.params;
  const action = urlJoin('/licences/', licenceId, 'charge-information/charge-element', elementId, 'loss');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('loss', {
    errors: {
      'any.required': {
        message: 'Select loss category'
      }
    },
    choices: options(defaultChargeData, sessionData.purpose)
  }, sessionData.loss || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    loss: Joi.string().required().allow(['high', 'medium', 'low', 'very low'])
  };
};

exports.schema = schema;

exports.form = form;
