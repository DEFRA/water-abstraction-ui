const Joi = require('joi');
const { formFactory, fields, applyErrors } = require('../../../../shared/lib/forms');

/**
 * @return {Object} - form object
 */
const form = () => {
  const f = formFactory('/signin');

  f.fields.push(fields.text('email', {
    label: 'Email address',
    hint: 'This is the email address used to create your account.',
    type: 'email',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: 'Enter your email address'
      }
    }
  }));

  f.fields.push(fields.text('password', {
    label: 'Password',
    hint: 'Enter the password you created.',
    type: 'password',
    controlClass: 'govuk-!-width-one-half',
    attr: {
      autocomplete: 'off'
    }
  }));

  f.fields.push(fields.button(null, { label: 'Sign in',
    controlClass: 'govuk-button govuk-button--start'
  }));

  return f;
};

const schema = {
  email: Joi.string().email().required(),
  password: Joi.string().required()
};

const applyErrorState = form => {
  return applyErrors(form, [{
    name: 'email',
    message: 'Re-enter your email address',
    summary: 'Yo'
  }, {
    name: 'password',
    message: 'Re-enter your password'
  }]);
};

exports.signInForm = form;
exports.signInSchema = schema;
exports.signInApplyErrorState = applyErrorState;
