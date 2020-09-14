const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const form = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;

  const f = formFactory('/contact-entry/new/details/fao');

  f.fields.push(fields.radio('FAOIsRequired', {
    errors: {
      'any.empty': {
        message: 'Select an option'
      },
      'string.regex.base': {
        message: 'Select an option'
      }
    },
    choices: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }]
  }, defaultValue));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  FAOIsRequired: Joi.boolean().required()
};

exports.form = form;
exports.schema = schema;
