'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const { snakeCase } = require('lodash');

const mapChoices = finData =>
  finData.map((d, index) => ({
    label: `${d.from} to ${d.to}`,
    hint: d.isCurrentYear ? 'current year' : '',
    value: `financial-year-${index}`
  }));

const selectBillingFinancialYearsForm = (request, financialYears) => {
  const { csrfToken } = request.view;
  const billingType = snakeCase(request.params.billingType);
  const season = snakeCase(request.params.season);

  const action = '/billing/batch/financial-year';
  const form = formFactory(action, 'POST');

  form.fields.push(fields.radio('selectedFinancialyear', {
    errors: {
      'any.required': {
        message: 'Select the financial year'
      }
    },
    choices: mapChoices(financialYears)
  }));

  form.fields.push(fields.hidden('selectedBillingType', {}, billingType));
  form.fields.push(fields.hidden('selectedTwoPartTariffSeason', {}, season));
  form.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  form.fields.push(fields.button(null, { label: 'Continue' }));
  return form;
};

module.exports = {
  selectBillingFinancialYearsForm
};
