const { formFactory, fields } = require('shared/lib/forms');

/**
 * Creates a form object containing a single button and hidden CSRF token field
 * @param  {Object} request - current HAPI request
 * @return {Object}         - form object
 */
const sendFinalRemindersForm = (request) => {
  const { csrfToken } = request.view;

  const action = `/returns-notifications/final-reminder`;

  const f = formFactory(action);
  f.fields.push(fields.button(null, { label: 'Send reminders' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

exports.sendFinalRemindersForm = sendFinalRemindersForm;
