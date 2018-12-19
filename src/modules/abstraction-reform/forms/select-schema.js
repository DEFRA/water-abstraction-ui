const { formFactory, fields } = require('../../../lib/forms');

const getChoices = (schema) => {
  return schema.map(item => {
    return {
      value: item.id,
      label: item.title,
      hint: item.description
    };
  });
};

/**
 * Creates a form object to select a schema for the WR22 condition to add
 * @param  {Object} request - HAPI request instance
 * @param  {Array} schema  - array of JSON schema objects
 * @return {Object}         form object
 */
const selectSchemaForm = (request, schema) => {
  const { csrfToken } = request.view;

  const { documentId } = request.params;
  const action = `/admin/abstraction-reform/licence/${documentId}/select-schema`;

  const f = formFactory(action);

  f.fields.push(fields.radio('schema', {
    choices: getChoices(schema),
    errors: {
      'any.required': {
        message: 'Choose a further condition to add'
      }
    }
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = {
  selectSchemaForm
};
