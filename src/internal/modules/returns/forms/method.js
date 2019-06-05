const { get } = require('lodash');
const { formFactory, fields } = require('../../../../shared/lib/forms');
const { STEP_METHOD, getPath } = require('../lib/flow-helpers');

const getValue = data => {
  const method = get(data, 'reading.method');
  const type = get(data, 'reading.type');
  return `${method},${type}`;
};

const methodForm = (request, data) => {
  const { csrfToken } = request.view;
  const action = getPath(STEP_METHOD, request);

  const f = formFactory(action);

  f.fields.push(fields.paragraph(null, {
    text: 'How are you reporting your figures?',
    element: 'h3',
    controlClass: 'govuk-heading-m'
  }));

  f.fields.push(fields.paragraph(null, {
    text: 'If you used more than one meter you must provide volumes'
  }));

  f.fields.push(fields.radio('method', {
    errors: {
      'any.required': {
        message: 'Select readings from one meter, or other (abstraction volumes)'
      }
    },
    choices: [
      { value: 'oneMeter,measured', label: 'Readings from a single meter' },
      { value: 'abstractionVolumes,measured', label: 'Volumes from one or more meters' },
      { value: 'abstractionVolumes,estimated', label: 'Estimates without a meter' }
    ] }, getValue(data)));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = methodForm;
