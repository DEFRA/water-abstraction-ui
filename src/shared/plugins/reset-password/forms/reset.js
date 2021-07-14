const Joi = require('joi');
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
      'string.empty': {
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

const schema = Joi.object().keys({
  email: Joi.string().required().email()
});

exports.resetForm = form;
exports.resetSchema = schema;
