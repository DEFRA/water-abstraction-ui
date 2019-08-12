const Joi = require('joi');
const { formFactory, fields, setValues, applyErrors } = require('shared/lib/forms');

const verifyNewEmailForm = (request, data = {}) => {
  const { csrfToken } = request.view;

  const f = formFactory('/account/change-email/verify-new-email');

  f.fields.push(fields.text('verificationCode', {
    type: 'text',
    label: 'Enter the code',
    attr: {
      maxlength: 6
    },
    autoComplete: 'one-time-code',
    controlClass: 'govuk-input--width-4',
    errors: {
      'any.empty': {
        message: 'Check your code'
      },
      'any.required': {
        message: 'Check your code'
      },
      'string.regex.base': {
        message: 'Check your code'
      }
    }
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return setValues(f, data);
};

/**
 * Depending on the error string returned from the water service,
 * applies error objects to the password form for re-rendering
 * @param {Object} form - the form object
 * @param {Number} code - HTTP status code
 * @return {Object} updated form with errors applied
 */
const verifyNewEmailApplyErrors = (form, code) => {
  return applyErrors(form, [{
    name: 'verificationCode',
    message: 'Check your code',
    summary: 'Check your code'
  }]);
};

const VERIFICATION_REGEX = /^[0-9]{6}$/;

const verifyNewEmailSchema = {
  csrf_token: Joi.string().guid().required(),
  verificationCode: Joi.string().required().regex(VERIFICATION_REGEX)
};

exports.verifyNewEmailForm = verifyNewEmailForm;
exports.verifyNewEmailApplyErrors = verifyNewEmailApplyErrors;
exports.verifyNewEmailSchema = verifyNewEmailSchema;
