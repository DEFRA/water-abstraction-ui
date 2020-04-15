const { formFactory, fields } = require('shared/lib/forms/');
/**
 * Creates an object to represent the form for confirming
 * or cancelling a billing batch
 *
 * @param {Object} request The Hapi request object
 * @param {String} action - the path to post to
 * @param {String} buttonText - the text for the submit button
 * @return {Object} form object
 */
const form = (request, action, buttonText) => {
  const { csrfToken } = request.view;
  const f = formFactory(action, 'POST');
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: buttonText }));
  return f;
};

module.exports = form;
