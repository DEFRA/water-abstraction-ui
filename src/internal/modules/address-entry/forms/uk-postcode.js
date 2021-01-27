'use strict';

const Joi = require('@hapi/joi');

const { get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms');
const session = require('../lib/session');
const { addressSources } = require('shared/lib/constants');
const { postcodeSchema } = require('../lib/postcode-validator');

const isFacadeAddress = address => address.source === addressSources.eaAddressFacade;

/**
 * Gets the value of the postcode form from the request
 * @param {*} request
 */
const getValue = request => {
  // Get the selected postcode from session data
  const { key } = request.params;
  const address = get(session.get(request, key), 'data', {});

  if (isFacadeAddress(address) && address.postcode) {
    return address.postcode;
  }

  const data = request.payload || request.query;
  return data.postcode;
};

/**
 * Creates an object to represent the form for capturing the
 * UK postcode to use for looking up addresses
 *
 * @param {Object} request The Hapi request object
 * @param {String} postcode The UK postcode
 */
const form = request => {
  const { key } = request.params;
  const postcode = getValue(request);

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
