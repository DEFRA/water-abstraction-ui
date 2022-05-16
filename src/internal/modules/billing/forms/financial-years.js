'use strict';
const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const { TWO_PART_TARIFF } = require('../lib/bill-run-types');

const { snakeCase } = require('lodash');

const mapChoices = finData =>
  finData.map((d, index) => ({
    label: `${d.from} to ${d.to}`,
    hint: d.isCurrentYear ? 'current year' : '',
    value: `financial-year-${d.from}-${d.to}`
  }));

const selectBillingFinancialYearsForm = (request, financialYears) => {
  const { csrfToken } = request.view;
  const billingType = snakeCase(request.params.billingType);
  const season = snakeCase(request.params.season);
  const region = request.params.region;

  const action = '/billing/batch/financial-year';
  const form = formFactory(action, 'POST');

  form.fields.push(fields.radio('selectedFinancialyear', {
    errors: {
      'any.required': {
        message: 'Select the financial year'
      },
      'any.valid': {
        message: 'Select the financial year you dummy'
      }
    },
    choices: mapChoices(financialYears)
  }));

  form.fields.push(fields.hidden('selectedBillingType', {}, billingType));
  form.fields.push(fields.hidden('selectedTwoPartTariffSeason', {}, season));
  form.fields.push(fields.hidden('selectedBillingRegion', {}, region));
  form.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  form.fields.push(fields.button(null, { label: 'Continue' }));
  return form;
};

const billingFinancialYearsFormSchema = finYears => (Joi.object({
  csrf_token: Joi.string().uuid().required(),
  selectedBillingRegion: Joi.string().uuid().required(),
  selectedBillingType: Joi.string().required(),
  selectedTwoPartTariffSeason: Joi.string().allow('').when('selectedBillingType', {
    is: TWO_PART_TARIFF,
    then: Joi.string().allow().required()
  }),
  selectedFinancialyear: Joi.string().required() // TODO: needs to be map to a valid range
}));

module.exports = {
  selectBillingFinancialYearsForm,
  billingFinancialYearsFormSchema
};
