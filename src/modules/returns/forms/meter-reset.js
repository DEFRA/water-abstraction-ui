const { formFactory, fields } = require('../../../lib/forms');
const { STEP_METER_RESET, getPath } = require('../lib/flow-helpers');

const meterResetForm = (request) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_METER_RESET, request);

  const f = formFactory(action);

  f.fields.push(fields.paragraph(null, {
    text: 'Did your meter reset in this abstraction period?',
    element: 'h3',
    controlClass: 'govuk-heading-m'
  }));

  f.fields.push(fields.radio('meterReset', {
    mapper: 'booleanMapper',
    errors: {
      'any.required': {
        message: 'Has your meter reset or rolled over?'
      }
    },
    choices: [
      { value: true, label: 'Yes', hint: 'You will need to provide abstraction volumes instead of meter readings' },
      { value: false, label: 'No' }
    ] }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = meterResetForm;
