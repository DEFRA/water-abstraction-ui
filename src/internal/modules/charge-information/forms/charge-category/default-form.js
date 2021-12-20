'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS, ROUTING_CONFIG } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');

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
  const config = ROUTING_CONFIG[step];

  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS[step]);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio(step, {
    errors: {
      'any.required': {
        message: config.errorMessage
      }
    },
    choices: Object.values(config.options)
      .map(row => { return { value: row, label: row }; })
  }, data[step] || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  const { step } = request.params;
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    [step]: Joi.string().valid(...Object.values(ROUTING_CONFIG[step].options)).required()
  });
};

exports.schema = schema;

exports.form = form;
