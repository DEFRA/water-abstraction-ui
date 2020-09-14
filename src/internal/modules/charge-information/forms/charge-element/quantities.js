'use strict';

const urlJoin = require('url-join');
const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { optional } = require('@hapi/joi');

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId, elementId } = request.params;
  const action = urlJoin('/licences/', licenceId, 'charge-information/charge-element', elementId, 'quantities');

  const f = formFactory(action, 'POST');
  f.fields.push(fields.text('authorisedAnnualQuantity', {
    controlClass: 'govuk-input govuk-input--width-10',
    label: 'Authorised',
    suffix: 'megalitres per year',
    errors: {
      'any.empty': {
        message: 'Enter the authorised quantity'
      }
    }
  }, sessionData.authorised || ''));
  f.fields.push(fields.text('billableAnnualQuantity', {
    label: 'Billable (optional)',
    suffix: ' megalitres per year',
    controlClass: 'govuk-input govuk-input--width-10'
  }, sessionData.billable || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    authorisedAnnualQuantity: Joi.number().integer().required(),
    billableAnnualQuantity: Joi.number().integer().allow('').optional()
  };
};

exports.schema = schema;

exports.form = form;
