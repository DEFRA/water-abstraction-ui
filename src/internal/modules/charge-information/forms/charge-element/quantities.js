'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { capitalize } = require('lodash');
const { CHARGE_ELEMENT_STEPS } = require('../../lib/charge-elements/constants');
const { getChargeElementData, getChargeElementActionUrl } = require('../../lib/form-helpers');

const getFormField = (key, data) => {
  const fieldName = `${key}AnnualQuantity`;
  return fields.text(fieldName, {
    controlClass: 'govuk-input govuk-input--width-10',
    label: `${capitalize(key)}${key === 'billable' ? ' (optional)' : ''}`,
    suffix: 'megalitres per year',
    errors: {
      'any.empty': {
        message: `Enter an ${key} quantity`
      },
      'number.base': {
        message: `Enter a valid ${key} quantity as a number that is more than zero`
      },
      'number.greater': {
        message: `Enter a valid ${key} quantity as a number that is more than zero`
      }
    }
  }, data[fieldName] || '');
};

/**
 * Form to request the abstraction quantities
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeElementData(request);
  const action = getChargeElementActionUrl(request, CHARGE_ELEMENT_STEPS.quantities);

  const f = formFactory(action, 'POST');
  f.fields.push(getFormField('authorised', data));
  f.fields.push(getFormField('billable', data));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    authorisedAnnualQuantity: Joi.number().integer().greater(0).required(),
    billableAnnualQuantity: Joi.number().integer().greater(0).allow('').optional()
  };
};

exports.schema = schema;

exports.form = form;
