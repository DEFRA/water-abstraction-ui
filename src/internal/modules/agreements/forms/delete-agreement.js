const { formFactory, fields } = require('shared/lib/forms/');
/**
 * Creates an object to represent the form for deleting
 * an agreement
 *
 * @param {Object} request The Hapi request object
 * @param {String} action - the path to post to
 * @return {Object} form object
 */
const form = request => {
  const { csrfToken } = request.view;
  const { agreement, licence } = request.pre;
  const f = formFactory(`/licences/${licence.id}/agreements/${agreement.id}/delete`, 'POST');
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Delete agreement' }));
  return f;
};

exports.deleteAgreementForm = form;
