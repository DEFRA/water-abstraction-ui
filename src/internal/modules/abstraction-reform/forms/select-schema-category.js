const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms');

const mapChoice = (category) => {
  const { title, slug } = category;
  return { label: title, value: slug };
};

/**
 * Creates a form object to select a schema for the WR22 condition to add
 * @param  {Object} request - HAPI request instance
 * @param  {Array} categories  - array of WR22 schema categories
 * @return {Object}         form object
 */
const selectSchemaCategoryForm = (request, categories) => {
  const { csrfToken } = request.view;

  const { documentId } = request.params;
  const action = `/digitise/licence/${documentId}/select-schema-category`;

  const f = formFactory(action);

  f.fields.push(fields.radio('category', {
    choices: categories.map(mapChoice),
    errors: {
      'any.required': {
        message: 'Choose a further condition category'
      }
    }
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

const selectSchemaCategoryFormSchema = Joi.object().keys({
  category: Joi.any().required(),
  csrf_token: Joi.string().guid().required()
});

module.exports = {
  selectSchemaCategoryForm,
  selectSchemaCategoryFormSchema
};
