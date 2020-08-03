'use strict';

const urlJoin = require('url-join');
const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('joi');

const widthClass = {
  20: { controlClass: 'govuk-input govuk-input--width-20' },
  5: { controlClass: 'govuk-input govuk-input--width-5' }
};

/**
 * Returns an object to create a new contact
 * @param {Object} request The Hapi request object
 * @param {Object} selectedContact previously entered contact details
  */
const createContactForm = (request, selectedContact = {}) => {
  const { csrfToken } = request.view;
  const { regionId, companyId } = request.params;
  const action = urlJoin('/invoice-accounts/create', regionId, companyId, 'create-contact');
  const f = formFactory(action, 'POST');

  f.fields.push(fields.text('title',
    { ...widthClass[20],
      label: 'Title (optional)'
    }, selectedContact.title));

  f.fields.push(fields.text('firstName',
    { ...widthClass[20],
      errors: { 'any.empty': { message: 'Enter a first name' } },
      label: 'First name'
    }, selectedContact.firstName));

  f.fields.push(fields.text('middleInitials',
    { ...widthClass[5],
      label: 'Middle initials (optional)'
    }, selectedContact.middleInitials));

  f.fields.push(fields.text('lastName',
    { ...widthClass[20],
      errors: { 'any.empty': { message: 'Enter a last name' } },
      label: 'Last name'
    }, selectedContact.lastName));

  f.fields.push(fields.text('suffix',
    { ...widthClass[20],
      label: 'Suffix (optional)'
    }, selectedContact.suffix));

  f.fields.push(fields.text('department',
    { ...widthClass[20],
      label: 'Department (optional)'
    }, selectedContact.department));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const createContactFormSchema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    title: Joi.string().trim().optional().allow(''),
    firstName: Joi.string().trim().required(),
    middleInitials: Joi.string().trim().optional().allow(''),
    lastName: Joi.string().trim().required(),
    department: Joi.string().trim().replace(/\./g, '').optional().allow(''),
    suffix: Joi.string().trim().optional().allow('')
  };
};

exports.createContactFormSchema = createContactFormSchema;
exports.createContactForm = createContactForm;
