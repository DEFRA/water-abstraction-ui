
/**
 * Formats a Joi error to a simple object which can easily be used in a
 * Handlebars template.
 * The field name and the validation that failed are converted into a string
 * which can then be tested in the view, e.g. {# if error.password_min }...
 *
 * The output is e.g.:  { password_min : true, confirmPassword_empty : true }
 * @param {Object} Joi error
 * @return {Object}
 */
const formatViewError = (error) => {
  if (!error) {
    return null;
  }
  if (!error.isJoi) {
    return error;
  }
  return error.details.reduce((memo, detail) => {
    memo[detail.path.join('_') + '_' + detail.type.split('.')[1]] = true;
    return memo;
  }, {});
};

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
