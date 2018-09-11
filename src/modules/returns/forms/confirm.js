const { formFactory, fields } = require('../../../lib/forms');
const { isInternalUser } = require('../lib/helpers');

const confirmForm = (request, action = `/return/nil-return`) => {
  const { csrfToken } = request.view;

  const scopedAction = `${isInternalUser(request) ? '/admin' : ''}${action}`;

  const f = formFactory(scopedAction);

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, {label: 'Confirm this return information'}));

  return f;
};

module.exports = confirmForm;
