/**
 * Delete a WR22 condition data item
 */
const { formFactory, fields } = require('../../../../shared/lib/forms');

/**
  * Creates a form object to select a schema for the WR22 condition to add
  * @param  {Object} request - HAPI request instance
  * @param  {Array} schema  - array of JSON schema objects
  * @return {Object}         form object
  */
const deleteForm = (request) => {
  const { csrfToken } = request.view;

  const { documentId, id } = request.params;
  const action = `/admin/digitise/licence/${documentId}/delete/${id}`;

  const f = formFactory(action);

  f.fields.push(fields.button(null, { label: 'Delete' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = {
  deleteForm
};
