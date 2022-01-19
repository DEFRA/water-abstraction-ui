'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('joi');
const { capitalize, camelCase, get } = require('lodash');
const session = require('../session');

const INPUT_WIDTH_20 = 'govuk-input govuk-input--width-20';
const INPUT_WIDTH_5 = 'govuk-input govuk-input--width-5';

const getOptionalInputField = (name, value, isInputWidth5 = false) =>
  fields.text(camelCase(name), {
    controlClass: isInputWidth5 ? INPUT_WIDTH_5 : INPUT_WIDTH_20,
    label: `${capitalize(name)} (Optional)`
  }, value);

const getNameField = (name, value) =>
  fields.text(camelCase(name), {
    controlClass: INPUT_WIDTH_20,
    errors: {
      'string.empty': {
        message: `Enter a ${name}`
      }
    },
    label: `${capitalize(name)}`
  }, value);

/**
 * Returns an object to update a contact name
 * @param {Object} request The Hapi request object
  */
const updateContactNameForm = request => {
  const f = formFactory(request.path);

  const contact = get(session.get(request), 'contactFromDatabase');

  f.fields.push(getOptionalInputField('title', contact.salutation));
  f.fields.push(getNameField('first name', contact.firstName));
  f.fields.push(getOptionalInputField('middle initials', contact.middleInitials), true);
  f.fields.push(getNameField('last name', contact.lastName));
  f.fields.push(getOptionalInputField('suffix', contact.suffix));
  f.fields.push(getOptionalInputField('department', contact.department));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const updateContactNameSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  title: Joi.string().trim().optional().allow(''),
  firstName: Joi.string().trim().required(),
  middleInitials: Joi.string().trim().optional().allow(''),
  lastName: Joi.string().trim().required(),
  department: Joi.string().trim().replace(/\./g, '').optional().allow(''),
  suffix: Joi.string().trim().optional().allow('')
});

exports.schema = updateContactNameSchema;
exports.form = updateContactNameForm;
