'use strict';

const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms/');
const urlJoin = require('url-join');

const options = {
  yes: { value: 'yes', label: 'Yes' },
  no: { value: 'no', label: 'No' }
};

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  selected value used to determine what radio option should be checked
  */
const addFaoForm = (request, selected) => {
  const { csrfToken } = request.view;
  const { regionId, companyId } = request.params;
  const action = urlJoin('/invoice-accounts/create', regionId, companyId, 'add-fao');
  // TODO another sub option might need to be added if selected = yes
  const checkedOption = options[selected];

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('faoRequired', {
    errors: {
      'any.required': {
        message: 'Select yes if you need to add a person or department as an FAO'
      }
    },
    choices: [options.yes, options.no],
    hint: 'For example, FAO Sam Burridge or FAO Accounts department'
  }, checkedOption));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const addFaoFormSchema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    faoRequired: Joi.string().required().valid(['yes', 'no'])
  };
};

exports.addFaoForm = addFaoForm;
exports.addFaoFormSchema = addFaoFormSchema;
