var pluralize = require('pluralize');
const { formFactory, fields } = require('shared/lib/forms');

const confirmForm = (request, count) => {
  const { csrfToken } = request.view;
  const { eventId } = request.params;

  const f = formFactory(`/returns/upload-submit/${eventId}`);

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  const label = `Submit ${count} ${pluralize('return', count)}`;
  f.fields.push(fields.button(null, { label }));

  return f;
};

module.exports = confirmForm;
