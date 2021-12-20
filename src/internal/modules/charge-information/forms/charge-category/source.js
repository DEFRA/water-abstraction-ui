'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { SOURCES, CHARGE_CATEGORY_STEPS } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');

/**
 * Form to request the charge element source
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeCategoryData(request);
  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.source);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('source', {
    errors: {
      'any.required': {
        message: 'Select a source'
      }
    },
    choices: Object.values(SOURCES).map(source => { return { value: source, label: source }; })
  }, data.source));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  source: Joi.string().required().valid(...Object.values(SOURCES))
});

exports.schema = schema;

exports.form = form;
