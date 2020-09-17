const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const { uniqBy } = require('lodash');
const { getAddressText } = require('../../address-entry/lib/helpers');

const getAddressChoices = addresses => {
  const choices = uniqBy(addresses, entity => [entity.postcode].join()).map(record => {
    return ({
      value: JSON.stringify(record),
      label: getAddressText(record)
    });
  });
  return choices;
};

const form = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;
  const { companiesHouseAddresses } = request.pre;

  const f = formFactory('/contact-entry/new/details/company-search/select-company-address');

  f.fields.push(fields.radio('selectedCompaniesHouseAddress', {
    errors: {
      'any.required': {
        message: 'Select a company address from the list'
      }
    },
    label: 'Select a company address',
    choices: getAddressChoices(companiesHouseAddresses)
  }, defaultValue));

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
