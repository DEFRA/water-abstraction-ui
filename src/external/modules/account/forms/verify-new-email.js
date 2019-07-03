const { formFactory, fields, setValues } = require('shared/lib/forms');

const verifyNewEmailForm = (request, data = {}) => {
  const { csrfToken } = request.view;

  const f = formFactory('/account/change-email/verify-new-email');

  f.fields.push(fields.text('verification-code', {
    type: 'text',
    label: 'Enter the code',
    attr: {
      maxlength: 6
    },
    autoComplete: 'one-time-code',
    controlClass: 'govuk-input--width-4',
    errors: {
      'any.empty': {
        message: 'Enter the verification code'
      }
    }
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return setValues(f, data);
};

exports.verifyNewEmailForm = verifyNewEmailForm;
