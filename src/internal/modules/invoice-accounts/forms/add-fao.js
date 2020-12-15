'use strict';

const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms/');
const { isNull } = require('lodash');
const urlJoin = require('url-join');

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
 * @param {Object|null} sessionContact contact data from the session
  */
const addFaoForm = (request, sessionContact) => {
  const { csrfToken } = request.view;
  const { regionId, companyId } = request.params;
  const action = urlJoin('/invoice-accounts/create', regionId, companyId, 'add-fao');
  // contact is undefined when landing on this page for the first time,
  // if selected 'no' previously contact === null
  const faoRequired = (sessionContact === undefined)
    ? sessionContact
    : !isNull(sessionContact);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('faoRequired', {
    errors: {
      'any.required': {
        message: 'Select yes if you need to add a person or department as an FAO'
      }
    },
    choices: [
      {
        value: true,
        label: 'Yes'
      },
      {
        value: false,
        label: 'No'
      }
    ],
    hint: 'For example, FAO Sam Burridge or FAO Accounts department'
  }, faoRequired));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const addFaoFormSchema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  faoRequired: Joi.boolean().required()
});

exports.addFaoForm = addFaoForm;
exports.addFaoFormSchema = addFaoFormSchema;
