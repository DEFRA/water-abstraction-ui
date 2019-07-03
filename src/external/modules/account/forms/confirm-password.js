const { formFactory, fields } = require('shared/lib/forms');

const confirmPasswordForm = request => {
  const { csrfToken } = request.view;

  const f = formFactory('/account/change-email/confirm-password');

  f.fields.push(fields.text('password', {
    type: 'password',
    autoComplete: 'current-password',
    label: 'Your account password',
    controlClass: 'govuk-input--width-20',
    errors: {
      'any.empty': {
        message: 'Please enter your password'
      }
    }
  }));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

exports.confirmPasswordForm = confirmPasswordForm;
