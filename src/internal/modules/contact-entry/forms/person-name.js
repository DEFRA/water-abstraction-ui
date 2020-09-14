const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const form = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;

  const f = formFactory('/contact-entry/new/details/person');

  f.fields.push(fields.text('personFullName', {
    label: 'Full name',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: 'Enter a name'
      }
    }
  }, defaultValue));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  personFullName: Joi.string().required()
};

exports.form = form;
exports.schema = schema;
