'use strict';

const Joi = require('@hapi/joi');
const titleCase = require('title-case');
const { get, isObject, isNull } = require('lodash');

const { formFactory, fields } = require('shared/lib/forms/');
const { BILLING_ACCOUNT_HOLDER, OTHER_ACCOUNT } = require('../lib/constants');

const getRadioValue = request => {
  const { agentCompany } = request.pre.sessionData.data;
  if (isObject(agentCompany)) {
    return OTHER_ACCOUNT;
  }
  if (isNull(agentCompany)) {
    return BILLING_ACCOUNT_HOLDER;
  }
};

const getSearchValue = request =>
  get(request, 'pre.sessionData.data.agentCompany.name');

const getChoices = request => {
  const { account } = request.pre;
  return ([
    {
      value: BILLING_ACCOUNT_HOLDER,
      label: titleCase(account.name),
      hint: titleCase(account.type)
    },
    {
      value: OTHER_ACCOUNT,
      label: 'Another billing contact',
      fields: [
        fields.text('accountSearch', {
          errors: {
            'any.empty': {
              message: 'Enter the name of an organisation or individual.'
            }
          },
          label: 'Search for organisation or individual'
        }, getSearchValue(request))
      ]
    }
  ]);
};

/**
 * returns the selected company id along with the region and company id
 *
 * @param {Object} request The Hapi request object
 * @param {Object} company The main company for the licence
 * @param {Object} companySelected The selected company which could be different from the main company
  */
const selectCompanyForm = request => {
  const { csrfToken } = request.view;

  const f = formFactory(request.path, 'POST');

  f.fields.push(fields.radio('account', {
    errors: {
      'any.required': {
        message: 'Select who the bills should go to'
      }
    },
    choices: getChoices(request)
  }, getRadioValue(request)));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectCompanyFormSchema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    account: Joi.string().required().valid([BILLING_ACCOUNT_HOLDER, OTHER_ACCOUNT]),
    accountSearch: Joi.string().allow('').when(
      'account',
      {
        is: OTHER_ACCOUNT,
        then: Joi.string().required()
      }
    )
  };
};

exports.form = selectCompanyForm;
exports.schema = selectCompanyFormSchema;
