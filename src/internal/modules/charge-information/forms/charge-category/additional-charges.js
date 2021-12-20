'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS } = require('../../lib/charge-categories/constants');
const { getChargeCategoryActionUrl, getChargeCategoryData } = require('../../lib/form-helpers');

/**
 * Form to select if two-part tariff (section 127) agreement should be
 * disabled at element level
 *
 * @param {Object} request The Hapi request object
 */
const form = request => {
  const { csrfToken } = request.view;

  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.charges);
  const f = formFactory(action, 'POST');

  const data = getChargeCategoryData(request);
  f.fields.push(fields.radio('additionalCharges', {
    errors: {
      'any.required': {
        message: 'Select yes if additional charges should apply'
      }
    },
    choices: [
      // {
      //   value: true,
      //   label: 'Yes'
      // },
      {
        value: false,
        label: 'No'
      }]
  }, data.additionalCharges));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  additionalCharges: Joi.boolean().required()
});

exports.schema = schema;
exports.form = form;
