const { formFactory, fields } = require('../../../lib/forms');

const form = (request, data) => {
  const f = formFactory('/admin/returns', 'GET');

  f.fields.push(fields.text('query', {
    label: 'Enter a return ID',
    errors: {
      'any.empty': {
        message: 'Enter a return ID'
      }
    }
  }));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

module.exports = form;
