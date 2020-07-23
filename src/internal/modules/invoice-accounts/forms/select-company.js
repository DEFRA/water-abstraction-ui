'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');

const choices = (company, companySelected) => {
  const options = [{ value: company.id, label: company.name, hint: company.type }];
  // if an agent company was previously selected add this to the list of options
  if (company.id !== companySelected.id) {
    options.push({ value: companySelected.id, label: companySelected.name, hint: companySelected.type });
  };
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
const selectCompanyForm = (request, company, companySelected) => {
  const { csrfToken } = request.view;
  const regionId = (request.params.regionId) ? request.params.regionId : '';
  const companyId = request.params.companyId ? request.params.companyId : '';
  const action = `/invoice-accounts/create/select-company`;

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('selectedCompany', {
    errors: {
      'any.required': {
        message: 'Select who the bills should go to'
      }
    },
    choices: choices(company, companySelected)
  }, { value: companySelected.id, label: companySelected.name, hint: companySelected.type }));
  f.fields.push(fields.hidden('companyId', {}, companyId));
  f.fields.push(fields.hidden('regionId', {}, regionId));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectCompanyFormSchema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    companyId: Joi.string().uuid().required(),
    regionId: Joi.string().uuid().required(),
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
