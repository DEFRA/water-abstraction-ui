'use strict';

const routing = require('../../lib/routing');
const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { capitalize } = require('lodash');

const getFormField = (key, sessionData) => {
  const fieldName = `${key}AnnualQuantity`;
  return fields.text(fieldName, {
    controlClass: 'govuk-input govuk-input--width-10',
    label: capitalize(key),
    suffix: 'megalitres per year',
    errors: {
      'any.empty': {
        message: `Enter an ${key} quantity`
      },
      'number.base': {
        message: `Enter a valid ${key} quantity as a number that is more than zero`
      }
    }
  }, sessionData[fieldName] || '');
};

/**
 * Form to request the abstraction quantities
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId, elementId } = request.params;
  const action = routing.getChargeElementStep(licenceId, elementId, 'quantities');

  const f = formFactory(action, 'POST');
  f.fields.push(getFormField('authorised', sessionData));
  f.fields.push(getFormField('billable', sessionData));
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
