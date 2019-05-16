const { cloneDeep } = require('lodash');
const { formFactory, fields } = require('../../../../shared/lib/forms');

const form = (request, data) => {
  const f = formFactory('/admin/returns', 'GET');

  f.fields.push(fields.text('query', {
    label: 'Enter a return reference',
    errors: {
      'any.empty': {
        message: 'You must enter a number'
      }
    }
  }));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

/**
 * If a return is not found by return ID, this method applies an
 * error state to the form
 * @param {Object} form
 * @return {Object} form in error state
 */
const searchApplyNoReturnError = (form) => {
  const f = cloneDeep(form);
  const error = {
    name: 'query',
    message: 'No return could be found for this reference',
    summary: 'No return could be found for this reference'
  };
  f.errors.push(error);
  f.fields[0].errors.push(error);
  return f;
};

module.exports = {
  searchForm: form,
  searchApplyNoReturnError
};
