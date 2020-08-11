const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const { postcodeSchema } = require('./postcode');

/**
 * Creates an object to represent the form for capturing the
 * UK postcode to use for looking up addresses
 *
 * @param {Object} request The Hapi request object
 * @param {String} postcode The UK postcode
 */
const form = (request, postcode) => {
  const { csrfToken } = request.view;

  const f = formFactory('/address-entry/postcode');

  f.fields.push(fields.text('postcode', {
    errors: {
      'any.empty': {
        message: 'Enter a UK postcode'
      },
      'string.regex.base': {
        message: 'Enter a real UK postcode'
      }
    },
    controlClass: 'govuk-input--width-10'
  }, postcode));

  f.fields.push(fields.link(null, {
    text: 'This address is outside the UK',
    url: '/address-entry/manual-entry'
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Find address' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  postcode: postcodeSchema
};

exports.form = form;
exports.schema = schema;
