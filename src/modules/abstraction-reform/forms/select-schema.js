const { flatMap, find, sortBy } = require('lodash');
const { formFactory, fields } = require('../../../lib/forms');

const mapSchemaToChoice = schema => {
  return {
    value: schema.id,
    label: schema.title,
    hint: schema.description
  };
};

const sortChoices = choices => {
  return sortBy(choices, choice => {
    const schemaSections = choice.value.split('.');
    const updatedSchema = schemaSections.map(section => {
      // Check if the string is a number
      if (!isNaN(parseFloat(section)) && isFinite(section)) {
        return (section.length > 1) ? section : `0${section}`;
      }
      return section;
    });
    return updatedSchema.join('');
  });
};

const getChoices = (schemas, category) => {
  const choices = flatMap(category.subcategories, subcategory => {
    return subcategory.schemas.map(id => mapSchemaToChoice(find(schemas, { id })));
  });
  return sortChoices(choices);
};

/**
 * Creates a form object to select a schema for the WR22 condition to add
 * @param  {Object} request - HAPI request instance
 * @param  {Array} category  - selected category of WR22 schema
 * @return {Object}         form object
 */
const selectSchemaForm = (request, schemas, category) => {
  const { csrfToken } = request.view;

  const { documentId, slug } = request.params;
  const action = `/admin/digitise/licence/${documentId}/select-schema/${slug}`;

  const f = formFactory(action);

  f.fields.push(fields.radio('schema', {
    choices: getChoices(schemas, category),
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
