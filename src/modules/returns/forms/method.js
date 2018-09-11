const { formFactory, fields } = require('../../../lib/forms');
const { isInternalUser } = require('../lib/helpers');

const methodForm = (request) => {
  const { csrfToken } = request.view;
  const action = `${isInternalUser(request) ? '/admin' : ''}/return/method`;

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
      { value: 'multipleMeters', label: 'Readings from more than one meter' },
      { value: 'abstractionVolumes', label: 'Abstraction volumes' }
    ]}));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = methodForm;
