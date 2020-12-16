'use strict';

const { formFactory, fields } = require('shared/lib/forms');
const { compact, get } = require('lodash');
const titleCase = require('title-case');
const Joi = require('@hapi/joi');
const queryString = require('querystring');
const routing = require('../lib/routing');
const { postcodeSchema } = require('../lib/postcode-validator');
const session = require('../lib/session');

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
const form = request => {
  const { csrfToken } = request.view;
  const { postcode } = request.query;
  const addresses = request.pre.addressSearchResults || [];

  // Get the uprn from session data
  const { key } = request.params;
  const uprn = get(session.get(request, key), 'data.uprn');

  const manualEntryLink = routing.getManualEntry(key, { country: COUNTRY_UK, postcode });

  const f = formFactory(`${request.path}?${queryString.stringify({ postcode })}`);

  f.fields.push(fields.dropdown('uprn', {
    mapper: 'numberMapper',
    errors: {
      'number.base': {
        message: 'Select an address from the list'
      }
    },
    label: 'Select an address',
    choices: getAddressChoices(addresses)
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

const getUprn = address => address.uprn;

const schema = request => {
  const { addressSearchResults } = request.pre;
  const validUprns = addressSearchResults.map(getUprn);
  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    uprn: Joi.number().integer().valid(validUprns).required(),
    postcode: postcodeSchema
  });
};

exports.form = form;
exports.schema = schema;
