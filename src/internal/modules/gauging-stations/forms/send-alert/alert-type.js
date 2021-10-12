const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../../lib/session');

const sendAlertTypeForm = request => {
  const f = formFactory(request.path);

  const defaultAlertType = get(session.get(request), 'sendingAlertType.value');

  f.fields.push(fields.radio('alertType', {
    errors: {
      'any.required': {
        message: 'Select the type of the alert'
      }
    },
    choices: [{
      value: 'warning',
      label: 'Warning',
      hint: 'Tell licence holders they may need to reduce or stop water abstraction soon.'
    },
    {
      value: 'reduce',
      label: 'Reduce',
      hint: 'Tell licence holders they can take water at a reduced amount.'
    },
    {
      value: 'stop',
      label: 'Stop',
      hint: 'Tell licence holders they must stop taking water.'
    },
    {
      value: 'resume',
      label: 'Resume',
      hint: 'Tell licence holders they can take water at the normal amount.'
    }
    ]
  }, defaultAlertType));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const sendAlertTypeSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  alertType: Joi.string().required().allow('warning', 'stop', 'reduce', 'resume')
});

exports.form = sendAlertTypeForm;
exports.schema = sendAlertTypeSchema;
