const { formFactory, fields, setValues } = require('shared/lib/forms');
const { getPath } = require('../lib/flow-helpers');
const { STEP_DATE_RECEIVED } = require('../lib/flow-helpers/steps');

const errorMessage = {
  message: 'Enter a date in the right format, for example 31 3 2018',
  summary: 'Enter a date in the right format'
};

const form = (request, data) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_DATE_RECEIVED, request, data);

  const f = formFactory(action);

  f.fields.push(fields.date('receivedDate', {
    type: 'date',
    label: 'When was the return received?',
    errors: {
      'any.required': errorMessage,
      'string.isoDate': errorMessage
    },
    enableJS: true
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return setValues(f, data);
};

module.exports = {
  returnReceivedForm: form
};
