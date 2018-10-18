const { get } = require('lodash');
const { formFactory, fields } = require('../../../lib/forms');

const methodForm = (request, data) => {
  const { csrfToken } = request.view;
  const isInternal = request.permissions.hasPermission('admin.defra');
  const action = `${isInternal ? '/admin' : ''}/return/method`;
  const method = get(data, 'reading.method');

  const f = formFactory(action);

  f.fields.push(fields.radio('method', {
    label: 'How are you reporting your return?',
    errors: {
      'any.required': {
        message: 'Select readings from one meter, from more than one meter or volumes'
      }
    },
    choices: [
      { value: 'oneMeter', label: 'Readings from one meter' },
      { value: 'abstractionVolumes', label: 'Other', hint: 'Use abstraction volumes' }
    ]}, method));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = methodForm;
