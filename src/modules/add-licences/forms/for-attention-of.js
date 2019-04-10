const { formFactory, fields } = require('../../../lib/forms');

const faoForm = (request) => {
  const { csrfToken } = request.view;
  const { address } = request.sessionStore.data;

  const action = `/add-addressee`;

  const f = formFactory(action);

  f.fields.push(fields.text('fao', {
    label: 'Enter a name and, or department (optional)',
    controlClass: 'govuk-!-width-three-quarters'
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('address', {}, address));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = faoForm;
