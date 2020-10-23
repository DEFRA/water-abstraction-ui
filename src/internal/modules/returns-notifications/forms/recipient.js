'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

const recipientForm = request => {
  const { document } = request.pre;
  const { csrfToken } = request.view;

  const f = formFactory(request.path);

  f.fields.push(fields.text('fullName', {
    caption: `Licence ${document.document.licenceNumber}`,
    label: 'Who should receive the form?',
    hint: 'Enter full name',
    heading: true,
    controlClass: 'govuk-input--width-20',
    errors: {
      'any.empty': {
        message: 'Enter a full name'
      }
    }
  }));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

const schema = () => Joi.object({
  fullName: Joi.string().required(),
  csrf_token: Joi.string().guid().required()
});

module.exports.form = recipientForm;
module.exports.schema = schema;
