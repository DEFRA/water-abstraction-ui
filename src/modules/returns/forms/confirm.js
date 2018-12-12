const { formFactory, fields } = require('../../../lib/forms');
const { getPath } = require('../lib/flow-helpers');

const confirmForm = (request, data, action = `/return/nil-return`) => {
  const { csrfToken } = request.view;

  const scopedAction = getPath(action, request);
  const f = formFactory(scopedAction);

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  // Set/clear under query status
  const isInternal = request.permissions.hasPermission('returns.edit');
  if (isInternal) {
    const { isUnderQuery } = data;
    f.fields.push(fields.checkbox('isUnderQuery', {
      label: 'Record as under query',
      checked: isUnderQuery,
      mapper: 'booleanMapper'
    }, 'true'));
  }

  f.fields.push(fields.button(null, {label: 'Submit return'}));

  return f;
};

module.exports = confirmForm;
