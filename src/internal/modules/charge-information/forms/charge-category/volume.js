'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');

/**
 * Form to request the abstraction quantities
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
 */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeCategoryData(request);
  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.volume);

  const f = formFactory(action, 'POST');
  f.fields.push(fields.text('volume', {
    controlClass: 'govuk-input govuk-input--width-10',
    suffix: 'ML',
    errors: {
      'string.pattern.base': {
        message: 'Enter a number with no more than 6 decimal places. For example, 20.123456'
      },
      'any.required': {
        message: 'Enter the volume in ML (megalitres).'
      },
      'string.empty': {
        message: 'Enter the volume in ML (megalitres).'
      },
      'number.unsafe': {
        message: 'Enter a number that is less than 1,000,000,000,000,000 or fewer than 17 digits long'
      }

    }
  }, data.volume || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => {
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    volume: Joi
      .number().positive().required().min(1).max(1000000000000000)
      .custom((value, helper) => {
        const { error, original } = helper;
        const [, decimals = ''] = original.split('.');
        if (decimals.length <= 6) {
          return value;
        }
        if (original.length < 17) {
          return value;
        }
        return error('number.custom');
      })
  });
};
exports.schema = schema;
exports.form = form;