const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const form = (request, h) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;

  const f = formFactory('/contact-entry/new/account-type');

  f.fields.push(fields.radio('accountType', {
    errors: {
      'any.empty': {
        message: 'Select an option'
      },
      'string.regex.base': {
        message: 'Select an option'
      }
    },
    choices: [
      { value: 'company', label: 'Company' },
      { value: 'individual', label: 'Individual' }]
  }, h));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  accountType: Joi.string().required().allow(['company', 'individual'])
};

exports.form = form;
exports.schema = schema;
