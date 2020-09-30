'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_ELEMENT_STEPS } = require('../../lib/charge-elements/constants');
const { getChargeElementData, getChargeElementActionUrl } = require('../../lib/form-helpers');

/**
 * Form to request the charge element description
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeElementData(request);
  const action = getChargeElementActionUrl(request, CHARGE_ELEMENT_STEPS.description);

  const f = formFactory(action, 'POST');
  f.fields.push(fields.text('description', {
    hint: 'For example, describe where the abstraction point is',
    errors: {
      'any.empty': {
        message: 'Enter a description of the element'
      }
    }
  }, data.description || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    description: Joi.string().required()
  };
};

exports.schema = schema;

exports.form = form;
