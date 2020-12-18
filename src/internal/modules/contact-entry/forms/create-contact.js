'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('joi');
const { capitalize, camelCase } = require('lodash');
const helpers = require('../lib/helpers');

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
      'any.empty': {
        message: `Enter a ${name}`
      } },
    label: `${capitalize(name)}`
  }, value);

/**
 * Returns an object to create a new contact
 * @param {Object} request The Hapi request object
  */
const createContactForm = request => {
  const f = formFactory(request.path);
  const contact = helpers.getContactFromSession(request);

  f.fields.push(getOptionalInputField('title', contact.title));
  f.fields.push(getNameField('first name', contact.firstName));
  f.fields.push(getOptionalInputField('middle initials', contact.middleInitials), true);
  f.fields.push(getNameField('last name', contact.lastName));
  f.fields.push(getOptionalInputField('suffix', contact.suffix));
  f.fields.push(getOptionalInputField('department', contact.department));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const createContactSchema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  title: Joi.string().trim().optional().allow(''),
  firstName: Joi.string().trim().required(),
  middleInitials: Joi.string().trim().optional().allow(''),
  lastName: Joi.string().trim().required(),
  department: Joi.string().trim().replace(/\./g, '').optional().allow(''),
  suffix: Joi.string().trim().optional().allow('')
});

exports.schema = createContactSchema;
exports.form = createContactForm;
