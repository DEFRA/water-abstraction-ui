'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { uniqBy, get, isEmpty } = require('lodash');
const addressMapper = require('shared/lib/mappers/address');
const { NEW_ADDRESS } = require('../lib/constants');
const session = require('../lib/session');

const getAddress = row => row.address;

const getAddressId = address => address.id;

const mapAddressToChoice = address => ({
  value: getAddressId(address),
  label: addressMapper.mapAddressToString(address)
});

const mapAddressesToChoices = addresses => uniqBy(
  addresses.map(getAddress),
  getAddressId
).map(mapAddressToChoice);

/**
 * Returns the selected address id for the invoice account
 * along with the predtermined company id and region id
 * @param {Object} request The Hapi request object
 * @param {Array} addresses Array of all company address
 * @param {uuid} selectedAddressId address id stored in session data for pre-selected option
  */
const selectAddressForm = request => {
  const { csrfToken } = request.view;
  const { addresses } = request.pre;
  const addressChoices = mapAddressesToChoices(addresses);
  const f = formFactory(request.path);

  // Get the address ID from session data
  const { key } = request.params;
  const address = get(session.get(request, key), 'data', {});
  const value = isEmpty(address) ? null : address.id || NEW_ADDRESS;

  f.fields.push(fields.radio('selectedAddress', {
    errors: {
      'any.required': {
        message: 'Select an existing address, or set up a new one.'
      }
    },
    choices: [
      ...addressChoices,
      {
        divider: 'or'
      },
      { value: NEW_ADDRESS, label: 'Set up a new address' }
    ]
  }, value));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectAddressFormSchema = request => {
  const { addresses } = request.pre;
  const validAddressIds = addresses
    .map(row => row.address.id);

  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    selectedAddress: Joi.string().uuid().valid(validAddressIds).allow(NEW_ADDRESS).required()
  });
};

exports.form = selectAddressForm;
exports.schema = selectAddressFormSchema;
