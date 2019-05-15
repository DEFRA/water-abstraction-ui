const Joi = require('joi');
const { formFactory, fields, setValues } = require('../../../lib/forms');

/**
 * Creates a form object for internal users to search by name, return, licence
 * number etc.
 * @param  {String} query - the search query entered by the user
 * @return {Object}       form object
 */
const form = (query) => {
  const f = formFactory('/admin/licences', 'GET');

  f.fields.push(fields.text('query', {
    widget: 'search',
    hint: 'Search by name, registered email address, return ID or licence number',
    errors: {
      'any.empty': {
        message: 'Enter a name, registered email address, return ID or licence number'
      }
    }
  }));

  return setValues(f, { query });
};

const schema = {
  query: Joi.string().trim()
};

module.exports = {
  searchForm: form,
  searchFormSchema: schema
};
