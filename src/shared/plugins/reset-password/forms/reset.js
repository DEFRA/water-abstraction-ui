const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

/**
 * @return {Object} - form object
 */
const form = (action) => {
  const f = formFactory(action);

  f.fields.push(fields.text('email', {
    label: 'Email address',
    type: 'email',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: 'Enter an email address'
      },
      'string.email': {
        message: 'Enter an email address in the correct format'
      }
    }
  }));

  f.fields.push(fields.button(null, {
    label: 'Continue',
    isStartButton: true
  }));

  return f;
};

const schema = {
  email: Joi.string().required().email()
};

exports.resetForm = form;
exports.resetSchema = schema;
