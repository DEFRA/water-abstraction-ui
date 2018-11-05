const { formFactory, fields } = require('../../../lib/forms');
const { STEP_INTERNAL_ROUTING, getPath } = require('../lib/flow-helpers');

const form = (request) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_INTERNAL_ROUTING, request);

  const f = formFactory(action);

  f.fields.push(fields.radio('action', {
    label: 'What would you like to do with this return?',
    errors: {
      'any.required': {
        message: 'Select what you would like to do with this return'
      }
    },
    choices: [
      { value: 'log_receipt', label: 'Log receipt (and come back to it later)' },
      { value: 'submit', label: 'Enter and submit it' }
    ]}));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = {
  internalRoutingForm: form
};
