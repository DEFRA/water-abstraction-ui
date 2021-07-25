const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms');
const { VALID_GUID, VALID_PASSWORD } = require('../../../lib/validators');
/**
 * @return {Object} - form object
 */
const form = (request, h) => {
  const f = formFactory('/reset_password_change_password');
  const { resetGuid: resetGuidFromPayload } = request.payload || {};
  const { resetGuid: resetGuidFromQuery } = request.query || {};
  f.fields.push(fields.hidden('resetGuid', {}, resetGuidFromPayload || resetGuidFromQuery));

  f.fields.push(fields.text('password', {
    label: 'Enter a new password',
    hint: 'Your password must be at least 8 characters long, and it must have an uppercase character, and a symbol.',
    type: 'password',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'string.empty': {
        message: 'Your password must be at least 8 characters long'
      },
      'password.empty': {
        message: 'Your password must be at least 8 characters long'
      },
      'password.min': {
        message: 'Your password must be at least 8 characters long'
      },
      'password.uppercase': {
        message: 'Your password must be contain an uppercase character'
      },
      'password.symbol': {
        message: 'Your password must be contain a symbol character'
      }

    }
  }));

  f.fields.push(fields.text('confirmPassword', {
    label: 'Confirm your password',
    type: 'password',
    controlClass: 'govuk-!-width-one-half'
  }));

  f.fields.push(fields.button(null, {
    label: 'Set password',
    isStartButton: true
  }));

  return f;
};

const schema = Joi.object().keys({
  resetGuid: VALID_GUID,
  password: VALID_PASSWORD,
  confirmPassword: Joi.any()
});

exports.changePasswordForm = form;
exports.changePasswordFormSchema = schema;
