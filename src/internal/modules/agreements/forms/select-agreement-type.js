'use strict';

const Joi = require('@hapi/joi');
const { get } = require('lodash');

const { formFactory, fields } = require('shared/lib/forms/');
const { agreementDescriptions } = require('shared/lib/mappers/agreements');

/**
 * Gets field description for financial agreement type radio buttons
 * @return {Object}
 */
const getFinancialAgreementTypeField = value => fields.radio('financialAgreementCode', {
  label: 'Select agreement',
  heading: true,
  size: 'l',
  errors: {
    'any.required': {
      message: 'Select the type of agreement you’re setting up'
    }
  },
  choices: Object.keys(agreementDescriptions).map(key => ({
    value: key,
    label: agreementDescriptions[key]
  }))
}, value);

/**
 * Gets form to select agreement type
 */
const selectAgreementTypeForm = request => {
  const { csrfToken } = request.view;

  console.log(request.pre.flowState);

  const financialAgreementCode = get(request, 'pre.flowState.code');

  const f = formFactory(request.path, 'POST');

  f.fields.push(getFinancialAgreementTypeField(financialAgreementCode));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectAgreementTypeSchema = () => ({
  csrf_token: Joi.string().uuid().required(),
  financialAgreementCode: Joi.string().required().valid(Object.keys(agreementDescriptions))
});

exports.form = selectAgreementTypeForm;
exports.schema = selectAgreementTypeSchema;
