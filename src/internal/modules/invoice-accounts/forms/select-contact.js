'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const urlJoin = require('url-join');
const { isEmpty } = require('lodash');
const helpers = require('../lib/helpers');

const otherOptions = (department) => [
  {
    value: 'person',
    label: 'Add a new person'
  },
  {
    value: 'department',
    label: 'Add a new department',
    fields: [
      fields.text('department', {
        errors: {
          'any.empty': {
            message: 'Enter a department'
          }
        },
        label: 'Department name'
      }, department)
    ]
  }];

const contactList = (contacts, department) => {
  const contactList = contacts.map(row => {
    return {
      value: row.id,
      label: (helpers.getName(row))
    };
  });
  // only add the divider or if the company has contacts
  return contactList.length > 0 ? [...contactList, { divider: 'or' }, ...otherOptions(department)] : otherOptions(department);
};

const getSelectedOption = (selectedContact) => {
  // a new department contact
  if (selectedContact.type === 'department') {
    return { id: selectedContact.type, department: selectedContact.department };
  // a new person contact
  } else if (selectedContact.type === 'person') {
    return { id: selectedContact.type };
  // an existing contact
  } else { return { id: selectedContact.contactId }; }
};
/**
 * returns the selected contact
 *
 * @param {Object} request The Hapi request object
 * @param {Array} contacts a list of contacts for a given company id
 * @param {Object} selectedContact previously selected contact stored in the session
  */
const selectContactForm = (request, contacts, selectedContact = null) => {
  const { csrfToken } = request.view;
  const { regionId, companyId } = request.params;
  const action = urlJoin('/invoice-accounts/create', regionId, companyId, 'select-contact');
  const department = isEmpty(selectedContact) ? null : selectedContact.department;

  const contactChoices = contactList(contacts, department);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('selectedContact', {
    errors: {
      'any.required': {
        message: 'Select an existing contact or select add new person or department'
      }
    },
    choices: contactChoices
  }, isEmpty(selectedContact) ? null : contactChoices.find(contact => contact.value === getSelectedOption(selectedContact).id)));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectContactFormSchema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    selectedContact: Joi.string().required().allow(['person', 'department', Joi.string().uuid()]),
    department: Joi.string().allow('').when(
      'selectedContact',
      {
        is: 'department',
        then: Joi.string().required()
      }
    )
  };
};

exports.selectContactForm = selectContactForm;
exports.selectContactFormSchema = selectContactFormSchema;
