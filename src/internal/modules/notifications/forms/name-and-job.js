const Joi = require('@hapi/joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');

const getTextField = (name, label, multiline = false) =>
  fields.text(name, {
    label,
    multiline,
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: `Enter a ${label.toLowerCase()}`
      }
    }
  });

const form = (request, data) => {
  const { csrfToken } = request.view;
  const f = formFactory('/notifications/contact');

  f.fields.push(fields.paragraph(null, {
    text: 'This will be visible to your public contacts'
  }));

  f.fields.push(getTextField('name', 'Name'));
  f.fields.push(getTextField('jobTitle', 'Job Title'));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return setValues(f, data);
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  name: Joi.string().required(),
  jobTitle: Joi.string().required()
};

exports.form = form;
exports.schema = schema;
