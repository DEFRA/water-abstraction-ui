const { get } = require('lodash');
const { formFactory, fields } = require('../../../lib/forms');
const { STEP_METHOD, getPath } = require('../lib/flow-helpers');

const methodForm = (request, data) => {
  const { csrfToken } = request.view;
  const action = getPath(STEP_METHOD, request);

  const method = get(data, 'reading.method');

  const f = formFactory(action);

  f.fields.push(fields.paragraph(null, {
    text: 'If you used more than one meter you must provide volumes' }));

  f.fields.push(fields.radio('method', {
    label: 'How are you reporting your figures?',
    errors: {
      'any.required': {
        message: 'Select readings from one meter, or other (abstraction volumes)'
      }
    },
    choices: [
      { value: 'oneMeter', label: 'Readings from a single meter' },
      { value: 'abstractionVolumes', label: 'Volumes from one or more meters' },
      { value: 'estimatedVolumes', label: 'Estimates without a meter' }
    ] }, method));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = methodForm;
