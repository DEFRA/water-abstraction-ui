const Joi = require('@hapi/joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');

const getTextField = (name, label, multiline = false) =>
  fields.text(name, { label, multiline, controlClass: 'govuk-!-width-one-half' });

const getAddressField = () =>
  fields.text('address', {
    label: 'Address',
    multiline: true,
    controlClass: 'govuk-!-width-three-quarters'
  });

const getEmailField = () =>
  fields.text('email', {
    label: 'Email address',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'string.email': {
        message: 'Enter a valid email'
      }
    }
  });

const form = (request, data) => {
  const { csrfToken } = request.view;
  const f = formFactory('/contact-information');

  f.fields.push(fields.paragraph(null, {
    text: 'This will be visible to your public contacts'
  }));

  f.fields.push(getTextField('name', 'Name'));
  f.fields.push(getTextField('jobTitle', 'Job Title'));

  f.fields.push(getEmailField());
  f.fields.push(getTextField('tel', 'Phone number'));
  f.fields.push(getAddressField());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Update' }));

  return setValues(f, data);
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  name: Joi.string().allow(''),
  jobTitle: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  tel: Joi.string().allow(''),
  address: Joi.string().allow('')
};

exports.contactDetailsForm = form;
exports.contactDetailsSchema = schema;
