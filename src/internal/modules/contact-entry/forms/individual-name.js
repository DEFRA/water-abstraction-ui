const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const form = (request, h) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;

  const f = formFactory('/contact-entry/new/details/individual');

  f.fields.push(fields.text('individualFullName', {
    label: 'Full name',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: 'Enter a name'
      }
    }
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  individualFullName: Joi.string().required()
};

exports.form = form;
exports.schema = schema;
