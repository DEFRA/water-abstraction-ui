const Joi = require('joi');
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
    hint: 'Enter a licence number, customer name, returns ID, registered email address or monitoring station',
    errors: {
      'string.empty': {
        message: 'Enter a licence number, customer name, returns ID, registered email address or monitoring station'
      }
    }
  }));

  return setValues(f, { query });
};

const schema = Joi.object({
  query: Joi.string().trim()
});

module.exports = {
  searchForm: form,
  searchFormSchema: schema
};
