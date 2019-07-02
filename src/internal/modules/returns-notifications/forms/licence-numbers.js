const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms');

const licenceNumbersForm = (request) => {
  const { csrfToken } = request.view;

  const action = `/returns-notifications/forms`;

  const f = formFactory(action);

  f.fields.push(fields.text('licenceNumbers', {
    errors: {
      'array.min': {
        message: 'Enter at least one licence number'
      }
    },
    mapper: 'licenceNumbersMapper',
    multiline: true,
    rows: 5,
    controlClass: 'form-control form-control-3-4',
    label: 'Add licence numbers that you wish to send paper return forms to.'
  }));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

const schema = {
  licenceNumbers: Joi.array().required().min(1).items(Joi.string()),
  csrf_token: Joi.string().guid().required()
};

module.exports = licenceNumbersForm;
module.exports.schema = schema;
