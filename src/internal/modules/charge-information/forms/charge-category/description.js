'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');

/**
 * Form to request the charge category description
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeCategoryData(request);
  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.description);

  const f = formFactory(action, 'POST');
  f.fields.push(fields.text('description', {
    hint: 'For example, describe where the abstraction point is',
    errors: {
      'string.empty': {
        message: 'Enter a description for the charge reference'
      },
      'any.required': {
        message: 'Enter a description for the charge reference'
      },
      'string.pattern.base': {
        message: 'Description for the charge reference must only include letters a-z, hyphens, numbers and not more than 180 characters long.'
      }
    }
  }, data.description || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => {
  const descriptionRegex = new RegExp(/^[a-z A-Z 0-9 - ' . ,]{1,180}$/);
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    description: Joi.string().pattern(descriptionRegex).required()
  });
};

exports.schema = schema;

exports.form = form;
