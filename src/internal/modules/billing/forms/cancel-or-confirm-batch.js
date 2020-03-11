const { formFactory, fields } = require('shared/lib/forms/');
const titleCase = require('title-case');
/**
 * Creates an object to represent the form for confirming
 * or cancelling a billing batch
 *
 * @param {Object} request The Hapi request object
 * @param  {String} batchAction 'confirm' or 'cancel''
  */
const form = (request, batchAction) => {
  const { csrfToken } = request.view;
  const { batchId } = request.params;
  const action = `/billing/batch/${batchId}/${batchAction}`;

  const f = formFactory(action, 'POST');
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  const label = `${titleCase(batchAction)} bill run`;
  f.fields.push(fields.button(null, { label }));
  return f;
};

exports.cancelOrConfirmBatchForm = form;
