'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { capitalize } = require('lodash');
const { CHARGE_ELEMENT_STEPS } = require('../../lib/charge-elements/constants');
const { getChargeElementData, getChargeElementActionUrl } = require('../../lib/form-helpers');

const getErrors = key => {
  const errors = { 'string.regex.base': {
    message: `Enter a number for the ${key} quantity using 6 decimal places or fewer, the number must be more than 0`
  } };
  if (key === 'authorised') {
    const requiredAuthorisedQuantityError = {
      message: `Enter an authorised quantity`
    };
    errors['any.required'] = requiredAuthorisedQuantityError;
    errors['any.empty'] = requiredAuthorisedQuantityError;
  };

  return errors;
};

const getFormField = (key, data) => {
  const fieldName = `${key}AnnualQuantity`;
  return fields.text(fieldName, {
    controlClass: 'govuk-input govuk-input--width-10',
    label: `${capitalize(key)}${key === 'billable' ? ' (optional)' : ''}`,
    suffix: 'megalitres per year',
    errors: getErrors(key)
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

  f.fields.push(fields.paragraph(null, {
    text: 'Enter a number with no more than 6 decimal places. For example, 20.123456',
    controlClass: 'govuk-hint'
  }));

  f.fields.push(getFormField('authorised', data));
  f.fields.push(getFormField('billable', data));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  const nonZeroNumberWithWSixDpRegex = /^[1-9]\d*\.?\d{0,6}$/;
  return {
    csrf_token: Joi.string().uuid().required(),
    authorisedAnnualQuantity: Joi.string().regex(nonZeroNumberWithWSixDpRegex).required(),
    billableAnnualQuantity: Joi.string().allow('').regex(nonZeroNumberWithWSixDpRegex).optional()
  };
};
exports.schema = schema;
exports.form = form;
