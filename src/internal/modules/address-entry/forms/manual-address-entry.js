const { formFactory, fields, setValues, applyErrors } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const { isEmpty } = require('lodash');
const countryList = require('./country-list');

const UNITED_KINGDOM = 'United Kingdom';
const { postcodeSchema } = require('./postcode');

const addressTextFields = [
  fields.text('addressLine1', {
    label: 'Sub-building',
    hint: 'For example, the flat or apartment number',
    controlClass: 'govuk-input--width-10'
  }),
  fields.text('addressLine2', {
    label: 'Building number',
    controlClass: 'govuk-input--width-5'
  }),
  fields.text('addressLine3', {
    label: 'Building name',
    controlClass: 'govuk-input--width-10'
  }),
  fields.text('addressLine4', {
    label: 'Street name',
    controlClass: 'govuk-!-width-two-thirds'
  }),
  fields.text('town', {
    label: 'Town or city',
    controlClass: 'govuk-!-width-two-thirds'
  }),
  fields.text('county', {
    label: 'County',
    controlClass: 'govuk-!-width-two-thirds'
  }),
  fields.text('postcode', {
    errors: {
      'any.required': {
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
  if (isEmpty(address) && request.query.country) {
    address.country = request.query.country;
  }

  let f = formFactory('/address-entry/manual-entry');

  f.fields.push(...addressTextFields);

  f.fields.push(fields.dropdown('country', {
    errors: {
      'any.allowOnly': { message: 'Select a country' },
      'any.empty': { message: 'Select a country' }
    },
    label: 'Country',
    choices: getCountryDropdownChoices(address.country)
  }));

  f = setValues(f, address);

  f.fields.push(fields.hidden('dataSource', {}, 'wrls'));
  f.fields.push(fields.hidden('uprn', {}, null));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const OPTIONAL_STRING = Joi.string().empty('').default(null);

const schema = {
  csrf_token: Joi.string().uuid().required(),
  addressLine1: OPTIONAL_STRING,
  addressLine2: OPTIONAL_STRING,
  addressLine3: OPTIONAL_STRING,
  addressLine4: OPTIONAL_STRING,
  town: OPTIONAL_STRING,
  county: OPTIONAL_STRING,
  postcode: OPTIONAL_STRING.when('country', {
    is: Joi.string().valid(UNITED_KINGDOM),
    then: postcodeSchema,
    otherwise: Joi.string().allow('').optional()
  }),
  country: Joi.string().required().valid(countryList),
  dataSource: Joi.string().required().valid('wrls'),
  uprn: OPTIONAL_STRING
};

const isAtLeastOneFieldPopulated = fields => fields.some(field => !isEmpty(field));

/**
  * Adds errors to the form for fields where one field
  * or the other is required
  *
  * @param {Object} form already validated against schema
  * @param {Object} address
  * @return {Object} form with added errors if exist
  */
const applyRequiredFieldErrors = (form, address) => {
  const { addressLine2, addressLine3, addressLine4, town } = address;
  const errors = [];

  if (!isAtLeastOneFieldPopulated([addressLine2, addressLine3])) {
    errors.push({
      name: 'addressLine2',
      message: 'Enter either a building number or building name',
      summary: 'Enter either a building number or building name'
    });
  }

  if (!isAtLeastOneFieldPopulated([addressLine4, town])) {
    errors.push({
      name: 'addressLine4',
      message: 'Enter either a street name or town or city',
      summary: 'Enter either a street name or town or city'
    });
  }

  if (!isEmpty(errors)) {
    // need to include existing errors so that they are not lost
    form.isValid = false;
    return applyErrors(form, [...errors, ...form.errors]);
  }

  return form;
};

exports.form = form;
exports.schema = schema;
exports.applyRequiredFieldErrors = applyRequiredFieldErrors;
