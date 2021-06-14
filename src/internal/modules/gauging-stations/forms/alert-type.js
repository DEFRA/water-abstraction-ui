const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');

const alertTypeForm = request => {
  const f = formFactory(request.path);

  f.fields.push(fields.radio('selectedAlertType', {
    errors: {
      'any.required': {
        message: 'Select an alert type'
      }
    },
    choices: [{
      value: 'stop',
      label: 'Stop'
    }, {
      value: 'reduce',
      label: 'Reduce'
    }]
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const alertTypeSchema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  alertType: Joi.string().required().allow('stop', 'reduce')
});

exports.form = alertTypeForm;
exports.schema = alertTypeSchema;
