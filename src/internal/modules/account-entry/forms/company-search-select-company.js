const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const { getAddressText } = require('../lib/helpers');

const getCompanyText = row =>
  `${row.company.name}, ${row.address ? getAddressText(row.address) : row.company.companyNumber}`;

const getCompanyChoices = companies =>
  [{ value: null, label: `${companies.length} companies found` },
    ...companies.map(record => {
      return ({
        value: record.company.companyNumber,
        label: getCompanyText(record)
      });
    })];

const form = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;
  const { companiesHouseResults } = request.pre;

  const f = formFactory('/contact-entry/new/details/company-search/select-company');

  f.fields.push(fields.dropdown('selectedCompaniesHouseNumber', {
    errors: {
      'any.required': {
        message: 'Select a company from the list'
      },
      'any.empty': {
        message: 'Select a company from the list'
      }
    },
    label: 'Select a company',
    choices: getCompanyChoices(companiesHouseResults)
  }, defaultValue));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  selectedCompaniesHouseNumber: Joi.string().required()
};

exports.form = form;
exports.schema = schema;
