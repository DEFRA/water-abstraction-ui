const { formFactory, fields } = require('shared/lib/forms/');

/**
 * Creates an object to represent the form for removing an
 * account from a billing batch
 *
 * @param {Object} request The Hapi request object
 * @param  {String} accountId guid of account to remove
  */
const deleteAccountFromBatchForm = (request, accountId) => {
  const { csrfToken } = request.view;
  const { batchId } = request.params;
  const action = `/billing/batch/${batchId}/delete-account/${accountId}`;
  const f = formFactory(action, 'POST');
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Remove invoice' }));
  return f;
};

exports.deleteAccountFromBatchForm = deleteAccountFromBatchForm;
