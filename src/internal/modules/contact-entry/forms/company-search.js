const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const form = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;

  const f = formFactory('/contact-entry/new/details/company-search');

  f.fields.push(fields.text('companyNameOrNumber', {
    label: 'Enter the Companies House number or company name',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: 'Enter the Companies House number or company name'
      }
    }
  }, defaultValue));

  f.fields.push(fields.paragraph(null, {
    text: 'We’ll use this information to search the Companies House register.'
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Find company' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  companyNameOrNumber: Joi.string().required()
};

exports.form = form;
exports.schema = schema;
