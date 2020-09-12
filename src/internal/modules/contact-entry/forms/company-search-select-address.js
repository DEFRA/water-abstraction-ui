const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const titleCase = require('title-case');
const { uniqBy, compact } = require('lodash');

const getAddressText = address => {
  const { addressLine1, addressLine2, addressLine3, addressLine4 } = address;
  const addressLines = compact([addressLine1, addressLine2, addressLine3, addressLine4])
    .map(line => titleCase(line))
    .join(' ');
  return `${addressLines}, ${titleCase(address.town)}, ${address.postcode}`;
};

const getAddressChoices = addresses => {
  const choices = uniqBy(addresses, entity => [entity.postcode].join()).map(record => {
    return ({
      value: JSON.stringify(record),
      label: getAddressText(record)
    });
  });
  return choices;
};

const form = (request, h) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;
  const { companiesHouseAddresses } = request.pre;

  const f = formFactory('/contact-entry/new/details/company-search/select-company-address');

  f.fields.push(fields.radio('selectedCompaniesHouseAddress', {
    errors: {
      'any.empty': {
        message: 'Select a company address from the list'
      },
      'string.regex.base': {
        message: 'Select a company address from the list'
      }
    },
    label: 'Select a company address',
    choices: getAddressChoices(companiesHouseAddresses)
  }, h));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  selectedCompaniesHouseAddress: Joi.string().required()
};

exports.form = form;
exports.schema = schema;
