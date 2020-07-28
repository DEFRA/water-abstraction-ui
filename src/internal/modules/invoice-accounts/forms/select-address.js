'use strict';

const Joi = require('@hapi/joi');
const urlJoin = require('url-join');
const { formFactory, fields } = require('shared/lib/forms/');

const address = (address) => {
  return [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    address.addressLine4,
    address.town,
    address.postcode
  ].filter(item => item !== '' && item !== null);
};

const addressList = (addresses) => addresses.map(row => {
  return {
    value: row.id,
    label: (address(row)).join(', ')
  };
});

/**
 * Returns the selected address id for the invoice account
 * along with the predtermined company id and region id
 * @param {Object} request The Hapi request object
 * @param {Array} addresses Array of all company address
 * @param {uuid} selectedAddressId address id stored in session data for pre-selected option
  */
const selectAddressForm = (request, addresses, selectedAddressId = null) => {
  const { csrfToken } = request.view;
  const regionId = request.params.regionId || '';
  const companyId = request.params.companyId || '';
  const action = urlJoin('/invoice-accounts/create', regionId, companyId, 'select-address');
  const addressChoices = addressList(addresses);
  const f = formFactory(action, 'POST');

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
      { value: 'new_address', label: 'Set up a new address' }
    ]
  }, ...addressChoices.filter(address => address.value === selectedAddressId)));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectAddressFormSchema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    selectedAddress: Joi.string().required().allow(['new_address', Joi.string().uuid()])
  };
};

exports.selectAddressForm = selectAddressForm;
exports.selectAddressFormSchema = selectAddressFormSchema;
