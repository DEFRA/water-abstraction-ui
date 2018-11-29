const { formFactory, fields } = require('../../../lib/forms');
const { STEP_START, getPath } = require('../lib/flow-helpers');

const amountsForm = (request) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_START, request);

  const f = formFactory(action);

  f.fields.push(fields.radio('isNil', {
    label: 'Has any water been abstracted in this return period?',
    mapper: 'booleanMapper',
    errors: {
      'any.required': {
        message: 'Has any water been abstracted?'
      }
    },
    choices: [
      { value: false, label: 'Yes' },
      { value: true, label: 'No' }
    ]}));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = amountsForm;
