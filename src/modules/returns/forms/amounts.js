const { formFactory, fields } = require('../../../lib/forms');

const amountsForm = (request) => {
  const { returnId } = request.query;
  const { csrfToken } = request.view;
  const action = `/admin/return?returnId=${returnId}`;

  const f = formFactory(action);

  f.fields.push(fields.radio('isNil', {
    label: 'Are there any abstraction amounts to report?',
    mapper: 'booleanMapper',
    choices: [
      { value: false, label: 'Yes' },
      { value: true, label: 'No' }
    ]}));

  f.fields.push(fields.button());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = amountsForm;
