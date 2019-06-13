const formatViewError = require('../../lib/format-view-error');

/**
 * Map new-style error object to existing handlebars template
 * @param {Object} error - Joi error
 * @return {Object} error in format for existing change password template
 */
function mapJoiPasswordError (error) {
  const viewErrors = formatViewError(error);

  const hasValidationErrors = (viewErrors.password_min || viewErrors.password_symbol || viewErrors.password_uppercase);

  return {
    hasValidationErrors,
    passwordTooShort: viewErrors.password_min,
    passwordHasNoSymbol: viewErrors.password_symbol,
    passwordHasNoUpperCase: viewErrors.password_uppercase,
    passwordsDontMatch: !viewErrors.confirmPassword_empty && viewErrors.confirmPassword_allowOnly,
    noConfirmPassword: viewErrors.confirmPassword_empty
  };
}

module.exports = mapJoiPasswordError;
