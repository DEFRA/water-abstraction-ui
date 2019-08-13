const { formFactory, fields, applyErrors } = require('shared/lib/forms');
const { VALID_PASSWORD, VALID_GUID } = require('shared/lib/validators');

const confirmPasswordForm = request => {
  const { csrfToken } = request.view;

  const f = formFactory('/confirm-password');

  f.fields.push(fields.text('password', {
    type: 'password',
    autoComplete: 'current-password',
    label: 'Your account password',
    controlClass: 'govuk-input--width-20',
    errors: {
      'any.empty': {
        message: 'Enter your password'
      },
      'string.symbol': {
        message: 'Check your password'
      },
      'string.min': {
        message: 'Check your password'
      },
      'string.uppercase': {
        message: 'Check your password'
      }
    }
  }));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

const schema = {
  password: VALID_PASSWORD,
  csrf_token: VALID_GUID
};

/**
 * Depending on the error string returned from the water service,
 * applies error objects to the password form for re-rendering
 * @param {Object} form - the form object
 * @param {Number} code - HTTP status code
 * @return {Object} updated form with errors applied
 */
const confirmPasswordApplyErrors = (form, code) => {
  return applyErrors(form, [{
    name: 'password',
    message: 'Check your password',
    summary: 'Check your password'
  }]);
};

exports.confirmPasswordForm = confirmPasswordForm;
exports.confirmPasswordSchema = schema;
exports.confirmPasswordApplyErrors = confirmPasswordApplyErrors;
