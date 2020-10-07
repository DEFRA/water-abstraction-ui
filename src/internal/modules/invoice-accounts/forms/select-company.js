'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const urlJoin = require('url-join');
const titleCase = require('title-case');

const choices = (companies, companySelected) => {
  const options = companies.filter(x => x).map(eachCompany => {
    return { value: eachCompany.id, label: titleCase(eachCompany.name), hint: titleCase(eachCompany.type) };
  });
  return [
    ...options,
    {
      value: 'company_search',
      label: 'Another billing contact',
      fields: [
        fields.text('companySearch', {
          errors: {
            'any.empty': {
              message: 'Enter the name of an organisation or individual.'
            }
          },
          label: 'Search for organisation or individual'
        })
      ]
    }
  ];
};

/**
 * returns the selected company id along with the region and company id
 *
 * @param {Object} request The Hapi request object
 * @param {Object} company The main company for the licence
 * @param {Object} companySelected The selected company which could be different from the main company
  */
const selectCompanyForm = (request, companies, companySelected = null) => {
  const { csrfToken } = request.view;
  const { regionId, companyId } = request.params;
  const action = urlJoin('/invoice-accounts/create', regionId, companyId);
  const checkedOption = companySelected ? { value: companySelected.id, label: titleCase(companySelected.name), hint: titleCase(companySelected.type) } : null;
  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('selectedCompany', {
    errors: {
      'any.required': {
        message: 'Select who the bills should go to'
      }
    },
    choices: choices(companies, companySelected)
  }, checkedOption));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectCompanyFormSchema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    selectedCompany: Joi.string().required().allow(['company_search', Joi.string().uuid()]),
    companySearch: Joi.string().allow('').when(
      'selectedCompany',
      {
        is: 'company_search',
        then: Joi.string().required()
      }
    )
  };
};

exports.selectCompanyForm = selectCompanyForm;
exports.selectCompanyFormSchema = selectCompanyFormSchema;
