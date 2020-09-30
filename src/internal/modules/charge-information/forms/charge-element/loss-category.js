'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { capitalize } = require('lodash');
const { LOSS_CATEGORIES, CHARGE_ELEMENT_STEPS } = require('../../lib/charge-elements/constants');
const { getChargeElementData, getChargeElementActionUrl } = require('../../lib/form-helpers');

const options = (defaultChargeData, selectedPurpose) => {
  const { loss } = defaultChargeData.find(row => row.purposeUse.id === selectedPurpose.id) || '';

  return LOSS_CATEGORIES.map(category => {
    const option = { value: category, label: capitalize(category) };
    if (category === loss) { option.hint = 'This is the default loss category for the purpose chosen'; };
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
  const { defaultCharges } = request.pre;
  const data = getChargeElementData(request);

  const action = getChargeElementActionUrl(request, CHARGE_ELEMENT_STEPS.loss);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('loss', {
    errors: {
      'any.required': {
        message: 'Select a loss category'
      }
    },
    choices: options(defaultCharges, data.purposeUse || {})
  }, data.loss || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    loss: Joi.string().valid(LOSS_CATEGORIES).required()
  };
};

exports.schema = schema;

exports.form = form;
