const { formFactory, fields } = require('../../../lib/forms');
const { STEP_METER_RESET, getPath } = require('../lib/flow-helpers');

const meterResetForm = (request) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_METER_RESET, request);

  const f = formFactory(action);

  f.fields.push(fields.paragraph(null, {
    text: 'Did your meter reset in this abstraction period?',
    element: 'h2',
    controlClass: 'heading-medium'
  }));

  f.fields.push(fields.paragraph(null, {
    text: 'If it did, you need to give us abstraction volumes'
  }));

  f.fields.push(fields.radio('meterReset', {
    mapper: 'booleanMapper',
    errors: {
      'any.required': {
        message: 'Has your meter reset or rolled over?'
      }
    },
    choices: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ] }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = meterResetForm;
