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

module.exports = formatViewError;
