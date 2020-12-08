'use strict';

const { pick } = require('lodash');
const { VALID_ADDRESS } = require('@envage/water-abstraction-helpers').validators;

const { formFactory, fields, setValues } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const countryList = require('./country-list');

const GOVUK_WIDTH_TWO_THIRDS = 'govuk-!-width-two-thirds';

const addressTextFields = [
  fields.text('addressLine1', {
    label: 'Sub-building',
    hint: 'For example, the flat or apartment number',
    controlClass: 'govuk-input--width-10'
  }),
  fields.text('addressLine2', {
    label: 'Building number',
    controlClass: 'govuk-input--width-5',
    errors: {
      'any.empty': {
        message: 'Enter either a building number or building name'
      }
    }
  }),
  fields.text('addressLine3', {
    label: 'Building name',
    controlClass: 'govuk-input--width-10'
  }),
  fields.text('addressLine4', {
    label: 'Street name',
    controlClass: GOVUK_WIDTH_TWO_THIRDS,
    errors: {
      'any.empty': {
        message: 'Enter either a street name or town or city'
      }
    }
  }),
  fields.text('town', {
    label: 'Town or city',
    controlClass: GOVUK_WIDTH_TWO_THIRDS
  }),
  fields.text('county', {
    label: 'County',
    controlClass: GOVUK_WIDTH_TWO_THIRDS
  }),
  fields.text('postcode', {
    errors: {
      'any.empty': {
        message: 'Enter a UK postcode'
      },
      'string.regex.base': {
        message: 'Enter a real UK postcode'
      }
    },
    label: 'Postcode or zip code',
    controlClass: 'govuk-input--width-10'
  })
];

const getCountryDropdownChoices = () => [
  {
    label: 'Select a country',
    selected: true
  },
  ...countryList.map(country => ({ label: country, value: country }))
];

/**
 * Creates an object to represent the form for capturing
 * an address
 *
 * @param {Object} request The Hapi request object
 * @param {Object} address contains address data values
 */
const form = (request, address = {}) => {
  const { csrfToken } = request.view;

  let f = formFactory(request.path);

  f.fields.push(...addressTextFields);

  f.fields.push(fields.dropdown('country', {
    errors: {
      'any.allowOnly': { message: 'Select a country' },
      'any.empty': { message: 'Select a country' }
    },
    label: 'Country',
    choices: getCountryDropdownChoices(address.country)
  }));

  // Allow country/postcode fields to be pre-populated by query params
  const data = Object.assign({}, address, pick(request.query, 'country', 'postcode'));
  f = setValues(f, data);

  f.fields.push(fields.hidden('uprn', {}, null));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const OPTIONAL_STRING = Joi.string().empty('').default(null);

const schema = () => VALID_ADDRESS.keys({
  csrf_token: Joi.string().uuid().required(),
  uprn: OPTIONAL_STRING
});

exports.form = form;
exports.schema = schema;
