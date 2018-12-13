const {
  mapFormField, mapFormDateField, mapFormErrorSummary, mapFormRadioField,
  mapFormDropdownField, mapFormCheckbox, setConditionalRadioField
} = require('./filters/form');

/**
 * Adds filters to supplied nunjucks environment
 * @param {Object} env - nunjucks environment
 * @return {Object} env - nunjucks environment
 */
const addFilters = (env) => {
  env.addFilter('mapFormField', mapFormField);
  env.addFilter('mapFormDateField', mapFormDateField);
  env.addFilter('mapFormErrorSummary', mapFormErrorSummary);
  env.addFilter('mapFormRadioField', mapFormRadioField);
  env.addFilter('mapFormDropdownField', mapFormDropdownField);
  env.addFilter('mapFormCheckbox', mapFormCheckbox);
  env.addFilter('setConditionalRadioField', setConditionalRadioField);
  return env;
};

module.exports = {
  addFilters
};
