const Joi = require('joi');
const { formFactory, fields, applyErrors } = require('../../../../shared/lib/forms');

/**
 * @return {Object} - form object
 */
const form = () => {
  const f = formFactory('/signin');

  f.fields.push(fields.text('email', {
    label: 'Email address',
    type: 'email',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: 'Enter an email address'
      },
      'string.email': {
        message: 'Enter an email address in the correct format, like name@example.com'
      }
    }
  }));

  f.fields.push(fields.text('password', {
    label: 'Password',
    type: 'password',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'any.empty': {
        message: 'Enter your password'
      }
    },
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

// Enter if empty, Check your if it's wrong
const applyErrorState = form => {
  if (form.errors.length) {
    return form;
  }

  // return form;
  return applyErrors(form, [{
    name: 'email',
    message: 'Check your email address',
    summary: 'Yo'
  }, {
    name: 'password',
    message: 'Check your password'
  }]);
};

exports.signInForm = form;
exports.signInSchema = schema;
exports.signInApplyErrorState = applyErrorState;
