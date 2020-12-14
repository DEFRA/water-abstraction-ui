'use strict';

const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms');

const { postcodeSchema } = require('../lib/postcode-validator');

/**
 * Creates an object to represent the form for capturing the
 * UK postcode to use for looking up addresses
 *
 * @param {Object} request The Hapi request object
 * @param {String} postcode The UK postcode
 */
const form = request => {
  const { key } = request.params;
  const { postcode } = request.payload || request.query;

  const f = formFactory(request.path, 'get');

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
    url: `/address-entry/${key}/manual-entry`
  }));

  f.fields.push(fields.button(null, { label: 'Find address' }));

  return f;
};

const schema = () => Joi.object({
  postcode: postcodeSchema
});

exports.form = form;
exports.schema = schema;
