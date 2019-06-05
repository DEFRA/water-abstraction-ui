const commaNumber = require('comma-number');
const { formFactory, fields } = require('../../../../shared/lib/forms');

const confirmForm = (request, count) => {
  const { csrfToken } = request.view;
  const { eventId } = request.params;

  const action = `/batch-notifications/send/${eventId}`;

  const f = formFactory(action);
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: `Send ${commaNumber(count)} letters` }));

  return f;
};

exports.confirmForm = confirmForm;
