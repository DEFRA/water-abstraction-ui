'use strict';

const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms');

/**
 * Creates an object to represent the form for capturing the
 * UK postcode to use for looking up addresses
 *
 * @param {Object} request The Hapi request object
 * @param {String} postcode The UK postcode
 */
const form = request => {
  const { csrfToken } = request.view;

  const f = formFactory(request.path);

  f.fields.push(fields.radio('useRegisteredAddress', {
    label: 'Use the registered office address?',
    subHeading: true,
    mapper: 'booleanMapper',
    choices: [
      {
        value: true,
        label: 'Yes'
      },
      {
        value: false,
        label: 'No'
      }
    ],
    errors: {
      'any.required': {
        message: 'Select whether to use the registered office address'
      }
    }
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  useRegisteredAddress: Joi.boolean().required()
});

exports.form = form;
exports.schema = schema;
