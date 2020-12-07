'use strict';

const { formFactory, fields } = require('shared/lib/forms');
const { compact } = require('lodash');
const titleCase = require('title-case');
const Joi = require('@hapi/joi');
const queryString = require('querystring');
const routing = require('../lib/routing');

const { COUNTRY_UK } = require('../lib/constants');

const getAddressText = address => {
  const { addressLine1, addressLine2, addressLine3, addressLine4 } = address;
  const addressLines = compact([addressLine1, addressLine2, addressLine3, addressLine4])
    .map(line => titleCase(line))
    .join(' ');
  return `${addressLines}, ${titleCase(address.town)}, ${address.postcode}`;
};

const getAddressChoices = addresses => {
  const choices = addresses.map(address => ({
    value: address.uprn,
    label: getAddressText(address)
  }));
  return [{
    label: `${addresses.length} addresses found`,
    selected: true
  },
  ...choices
  ];
};

/**
 * Creates an object to represent the form for selecting
 * an address
 *
 * @param {Object} request The Hapi request object
 */
const form = (request, uprn) => {
  const { csrfToken } = request.view;
  const { postcode } = request.query;
  const { addressSearchResults } = request.pre;

  const manualEntryLink = routing.getManualEntry(request, { country: COUNTRY_UK, postcode });

  const f = formFactory(`${request.path}?${queryString.stringify({ postcode })}`);

  f.fields.push(fields.dropdown('uprn', {
    errors: {
      'any.empty': {
        message: 'Select an address from the list'
      },
      'string.regex.base': {
        message: 'Select an address from the list'
      }
    },
    label: 'Select an address',
    choices: getAddressChoices(addressSearchResults)
  }, parseInt(uprn)));

  f.fields.push(fields.link(null, {
    text: 'I cannot find the address in the list',
    url: manualEntryLink
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('postcode', {}, postcode));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  uprn: Joi.string().regex(/^[0-9]+$/).required(),
  postcode: Joi.string().required().allow('')
};

exports.form = form;
exports.schema = schema;
