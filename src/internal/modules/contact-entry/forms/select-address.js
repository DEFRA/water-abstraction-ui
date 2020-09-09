const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const titleCase = require('title-case');
const { compact } = require('lodash');

const getAddressText = address => {
  const { addressLine1, addressLine2, addressLine3, addressLine4 } = address;
  const addressLines = compact([addressLine1, addressLine2, addressLine3, addressLine4])
    .map(line => titleCase(line))
    .join(' ');
  return `${addressLines}, ${titleCase(address.town)}, ${address.postcode}`;
};

const getAddressChoices = addresses => {
  console.log(addresses)
  const choices = addresses.map(record => {
    return ({
      value: record.address.id,
      label: getAddressText(record.address)
    });
  });
  return [...choices, { divider: 'or' }, {
    value: null,
    label: 'Another address'
  }];
};

const form = (request, id) => {
  const { csrfToken } = request.view;
  const { sessionKey, redirectPath } = request.query;
  const { addressSearchResults } = request.pre;

  const f = formFactory('/contact-entry/select-address');

  f.fields.push(fields.radio('id', {
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
  }, id));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('redirectPath', {}, redirectPath));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  redirectPath: Joi.string().required(),
  sessionKey: Joi.string().uuid().required(),
  id: Joi.string().uuid().required()
};

exports.form = form;
exports.schema = schema;
