const Joi = require('@hapi/joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');

const getAddressField = () =>
  fields.text('address', {
    label: 'Address',
    multiline: true,
    controlClass: 'govuk-!-width-three-quarters',
    errors: {
      'any.empty': {
        message: 'Enter a valid postal address'
      }
    }
  });

const getEmailField = () =>
  fields.text('email', {
    label: 'Email address',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: 'Enter a valid email address'
      },
      'string.email': {
        message: 'Enter a valid email address'
      }
    }
  });

const getTelField = () => fields.text('tel', {
  label: 'Phone number',
  controlClass: 'govuk-!-width-one-half',
  errors: {
    'any.empty': {
      message: 'Enter a valid telephone number'
    }
  }
});

const form = (request, data) => {
  const { csrfToken } = request.view;
  const f = formFactory('/notifications/contact-details');

  f.fields.push(fields.paragraph(null, {
    text: 'This will be visible to your public contacts'
  }));

  f.fields.push(getEmailField());
  f.fields.push(getTelField());
  f.fields.push(getAddressField());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return setValues(f, data);
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  email: Joi.string().email(),
  tel: Joi.string().required(),
  address: Joi.string().required()
};

exports.form = form;
exports.schema = schema;
