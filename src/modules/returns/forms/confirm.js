const { formFactory, fields } = require('../../../lib/forms');

const confirmForm = (request) => {
  const { csrfToken } = request.view;
  const action = `/admin/return/nil-return`;

  const f = formFactory(action);

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = confirmForm;
