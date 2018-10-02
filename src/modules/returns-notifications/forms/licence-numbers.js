const Joi = require('joi');
const { cloneDeep, set } = require('lodash');
const { formFactory, fields } = require('../../../lib/forms');

const licenceNumbersForm = (request) => {
  const { csrfToken } = request.view;

  const action = `/admin/returns-notifications/forms`;

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
    label: 'Enter your licence numbers',
    hint: 'Add licence numbers here for the licences you wish to send paper forms to. Return forms will be sent for any due returns.'
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
