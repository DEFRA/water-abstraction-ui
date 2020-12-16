'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CONTACT_TYPES } = require('../lib/constants');
const helpers = require('../lib/helpers');
const { mapContactToString } = require('shared/lib/mappers/contact');

const hasExistingContacts = contacts => contacts.length > 0;

const getDepartmentValue = contact =>
  (contact.type && contact.type === CONTACT_TYPES.department)
    ? contact.department
    : null;

const newContactChoices = department => [
  {
    value: CONTACT_TYPES.person,
    label: 'Add a new person'
  },
  {
    value: CONTACT_TYPES.department,
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

const getNewContactChoices = (contacts, contactData) => {
  const choices = hasExistingContacts(contacts) ? [{ divider: 'or' }] : [];
  choices.push(...newContactChoices(getDepartmentValue(contactData)));
  return choices;
};

const getContactList = contacts => contacts.map(contact => ({
  value: contact.id,
  label: mapContactToString(contact)
}));

const getContactChoices = (contacts, contactData) => {
  return [
    ...getContactList(contacts),
    ...getNewContactChoices(contacts, contactData)
  ];
};

/**
 * returns the selected contact
 *
 * @param {Object} request The Hapi request object
  */
const selectContactForm = request => {
  const f = formFactory(request.path);

  const { companyContacts } = request.pre;
  const contact = helpers.getContactFromSession(request);
  const value = contact ? contact.contactId || contact.type : null;

  f.fields.push(fields.radio('selectedContact', {
    errors: {
      'any.required': {
        message: 'Select an existing contact or select add new person or department'
      }
    },
    ...hasExistingContacts(companyContacts) && { hint: 'Existing contacts' },
    choices: getContactChoices(companyContacts, contact)
  }, value));
  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const getContactId = contact => contact.id;

const selectContactSchema = request => {
  const { companyContacts } = request.pre;
  const validContactIds = companyContacts.map(getContactId);

  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    selectedContact: Joi.string().required().valid(['person', 'department', ...validContactIds]),
    department: Joi.string().allow('').when(
      'selectedContact', {
        is: 'department',
        then: Joi.string().required()
      })
  });
};
exports.form = selectContactForm;
exports.schema = selectContactSchema;
