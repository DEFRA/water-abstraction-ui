'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { capitalize } = require('lodash');
const { LOSS_CATEGORIES, CHARGE_CATEGORY_STEPS } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');

const options = (selectedPurposeUse) => {
  return LOSS_CATEGORIES.map(category => {
    const option = { value: category, label: capitalize(category) };
    return option;
  });
};

/**
 * Form to request the loss category
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
 */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeCategoryData(request);

  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.loss);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('loss', {
    errors: {
      'any.required': {
        message: 'Select the loss'
      }
    },
    choices: options(data.purposeUse || {})
  }, data.loss || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  loss: Joi.string().valid(...LOSS_CATEGORIES).required()
});

exports.schema = schema;

exports.form = form;
