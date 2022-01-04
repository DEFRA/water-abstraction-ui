'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS, ROUTING_CONFIG, getStepKeyByValue } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');
const { capitalize } = require('lodash');

const getChoices = config => {
  const radioOtions = {
    errors: {
      'any.required': {
        message: config.errorMessage
      }
    },
    choices: config.boolean
      ? Object.values(config.options)
        .map(row => { return { value: row, label: row ? 'Yes' : 'No' }; })
      : Object.values(config.options)
        .map(row => { return { value: row, label: capitalize(row) }; })
  };
  return config.boolean ? { ...radioOtions, mapper: 'booleanMapper' } : radioOtions;
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
  const { step } = request.params;
  const stepKey = getStepKeyByValue(step);
  const config = ROUTING_CONFIG[stepKey];

  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS[stepKey]);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio(stepKey, getChoices(config), data[stepKey] || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = request => {
  const { step } = request.params;
  const stepKey = getStepKeyByValue(step);
  const config = ROUTING_CONFIG[stepKey];
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    [stepKey]: config.boolean
      ? Joi.boolean().required()
      : Joi.string().valid(...Object.values(config.options)).required()
  });
};

exports.schema = schema;

exports.form = form;
