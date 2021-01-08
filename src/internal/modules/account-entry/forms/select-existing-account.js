'use strict';
const Joi = require('@hapi/joi');
const { get } = require('lodash');

const { formFactory, fields } = require('shared/lib/forms');
const routing = require('../lib/routing');
const { NEW_ACCOUNT } = require('../lib/constants');

const mapCompaniesToChoices = companies => ([
  ...companies.map(company => ({
    value: company.id,
    label: company.name
  })),
  {
    divider: 'or'
  }, {
    value: NEW_ACCOUNT,
    label: 'Set up a new account'
  }
]);

const form = request => {
  const { csrfToken } = request.view;
  const { key } = request.params;
  const { q } = request.query;

  const { companies } = request.pre;
  const selectedCompanyId = get(request, 'pre.sessionData.data.id');

  const f = formFactory(routing.getSelectExistingAccount(key, q));

  f.fields.push(fields.radio('companyId', {
    errors: {
      'any.required': {
        message: 'Select an account from the list or set up a new account'
      }
    },
    choices: mapCompaniesToChoices(companies, selectedCompanyId)
  }, selectedCompanyId));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const getCompanyId = company => company.id;

const schema = request => {
  const { companies } = request.pre;
  const companyIds = companies.map(getCompanyId);
  return Joi.object({
    companyId: Joi.string().guid().required().valid(companyIds).allow(NEW_ACCOUNT),
    csrf_token: Joi.string().guid().required()
  });
};

exports.form = form;
exports.schema = schema;
