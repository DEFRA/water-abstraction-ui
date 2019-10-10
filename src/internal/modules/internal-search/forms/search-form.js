const Joi = require('@hapi/joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');

/**
 * Creates a form object for internal users to search by name, return, licence
 * number etc.
 * @param  {String} query - the search query entered by the user
 * @return {Object}       form object
 */
const form = (query) => {
  const f = formFactory('/licences', 'GET');

  f.fields.push(fields.text('query', {
    widget: 'search',
    label: 'Search by name, registered email address, return ID or licence number',
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
