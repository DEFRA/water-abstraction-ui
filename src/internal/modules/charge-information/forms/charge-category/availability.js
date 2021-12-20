'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS, WATER_AVAILABILITY } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');

/**
 * Form to request the waterAvailability category
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
 */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeCategoryData(request);

  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.availability);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('availability', {
    errors: {
      'any.required': {
        message: 'Select the water availability'
      }
    },
    choices: Object.values(WATER_AVAILABILITY)
      .map(availability => { return { value: availability, label: availability }; })
  }, data.availability || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  availability: Joi.string().valid(...Object.values(WATER_AVAILABILITY)).required()
});

exports.schema = schema;
exports.form = form;
