const { get } = require('lodash');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { STEP_INTERNAL_METHOD, getPath } = require('../lib/flow-helpers');

const form = (request, data) => {
  const { csrfToken } = request.view;
  const action = getPath(STEP_INTERNAL_METHOD, request);

  const method = get(data, 'reading.method');

  const f = formFactory(action);

  f.fields.push(fields.radio('method', {
    label: 'How was this return reported?',
    errors: {
      'any.required': {
        message: 'Select meter readings, or abstraction volumes'
      }
    },
    choices: [
      { value: 'oneMeter', label: 'Meter readings' },
      { value: 'abstractionVolumes', label: 'Abstraction volumes' }
    ]
  }, method));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return setValues(f, { method });
};

exports.internalMethodForm = form;
