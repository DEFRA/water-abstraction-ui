'use strict';

const Joi = require('@hapi/joi');
const urlJoin = require('url-join');
const { formFactory, fields } = require('shared/lib/forms/');
const titleCase = require('title-case');
const { isEmpty } = require('lodash');

const address = (address) => {
  return [
    titleCase(address.addressLine1),
    titleCase(address.addressLine2),
    titleCase(address.addressLine3),
    titleCase(address.addressLine4),
    titleCase(address.town),
    address.postcode
  ].filter(item => !isEmpty(item));
};

const addressList = (addresses) => {
  const addrList = addresses.map(row => {
    return {
      value: row.id,
      label: (address(row)).join(', ')
    };
  });
  return addrList.length > 0 ? [...addrList, { divider: 'or' }] : [];
};

/**
 * Returns the selected address id for the invoice account
 * along with the predtermined company id and region id
 * @param {Object} request The Hapi request object
 * @param {Array} addresses Array of all company address
 * @param {uuid} selectedAddressId address id stored in session data for pre-selected option
  */
const selectAddressForm = (request, addresses, selectedAddressId = null) => {
  const { csrfToken } = request.view;
  const { regionId, companyId } = request.params;
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
      { value: 'new_address', label: 'Set up a new address' }
    ]
  }, addressChoices.find(address => address.value === selectedAddressId)));
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
