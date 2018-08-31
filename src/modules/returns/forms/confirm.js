const { formFactory, fields } = require('../../../lib/forms');

const confirmForm = (request, action = `/admin/return/nil-return`) => {
  const { csrfToken } = request.view;

  const f = formFactory(action);

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, {label: 'Confirm this return information'}));

  return f;
};

module.exports = confirmForm;
