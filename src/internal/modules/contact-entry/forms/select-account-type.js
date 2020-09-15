const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const form = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;

  const f = formFactory('/contact-entry/new/account-type');

  f.fields.push(fields.radio('accountType', {
    errors: {
      'any.required': {
        message: 'Select an option'
      }
    },
    choices: [
      { value: 'organisation', label: 'Company or organisation' },
      { value: 'person', label: 'Individual' }]
  }, defaultValue));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  accountType: Joi.string().required().allow(['organisation', 'person'])
};

exports.form = form;
exports.schema = schema;
