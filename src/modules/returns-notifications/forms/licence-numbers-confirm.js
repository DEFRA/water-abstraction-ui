const { formFactory, fields } = require('../../../lib/forms');

const licenceNumbersForm = (request) => {
  const { csrfToken } = request.view;

  const action = `/admin/returns-notifications/forms-send`;

  const f = formFactory(action);

  f.fields.push(fields.hidden('licenceNumbers', {
    errors: {
      'array.min': {
        message: 'Enter at least one licence number'
      }
    },
    mapper: 'licenceNumbersMapper'
  }));
  f.fields.push(fields.button(null, { label: 'Send paper forms' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = licenceNumbersForm;
