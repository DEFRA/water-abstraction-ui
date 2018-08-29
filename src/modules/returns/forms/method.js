const { formFactory, fields } = require('../../../lib/forms');

const methodForm = (request) => {
  const { csrfToken } = request.view;
  const action = `/admin/return/method`;

  const f = formFactory(action);

  f.fields.push(fields.radio('isMeterReadings', {
    label: 'How do you want to report your return?',
    mapper: 'booleanMapper',
    choices: [
      { value: true, label: 'Meter readings' },
      { value: false, label: 'Other' }
    ]}));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = methodForm;
