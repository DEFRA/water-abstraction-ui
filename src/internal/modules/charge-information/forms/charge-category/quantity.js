'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');

const getErrors = key => {
  const errors = {
    'string.pattern.base': {
      message: 'Enter a number for the quantity using 6 decimal places or fewer, the number must be more than 0'
    },
    'any.required': {
      message: 'Enter a quantity'
    },
    'string.empty': {
      message: 'Enter a qauntity'
    }
  };

  return errors;
};

/**
 * Form to request the abstraction quantities
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
 */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeCategoryData(request);
  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.quantity);

  const f = formFactory(action, 'POST');
  f.fields.push(fields.text('quantity', {
    controlClass: 'govuk-input govuk-input--width-10',
    suffix: 'ML',
    errors: getErrors()
  }, data.quantity || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => {
  const nonZeroNumberWithWSixDpRegex = new RegExp(/^\s*(?=.*[1-9])\d*(?:\.\d{1,6})?\s*$/);
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    quantity: Joi.string().pattern(nonZeroNumberWithWSixDpRegex).required()
  });
};
exports.schema = schema;
exports.form = form;
