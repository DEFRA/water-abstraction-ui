const { formFactory, fields } = require('shared/lib/forms');
const { getPath } = require('../lib/flow-helpers');

const confirmForm = (request, data, action = `/return/nil-return`) => {
  const { csrfToken } = request.view;

  const scopedAction = getPath(action, request);
  const f = formFactory(scopedAction);

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Submit' }));

  return f;
};

module.exports = confirmForm;
