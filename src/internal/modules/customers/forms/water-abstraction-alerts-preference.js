const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../session');

const waterAbstractionAlertsPreferenceForm = request => {
  const f = formFactory(request.path);

  const defaultWaterAbstractionAlertsEnabledValue =
     get(session.get(request), 'waterAbstractionAlertsEnabled.value') ||
     get(session.get(request), 'waterAbstractionAlertsEnabledValueFromDatabase');

  f.fields.push(fields.radio('waterAbstractionAlertsEnabled', {
    errors: {
      'any.required': {
        message: 'Select Yes or No'
      }
    },
    choices: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  }, defaultWaterAbstractionAlertsEnabledValue));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const waterAbstractionAlertsPreferenceSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  waterAbstractionAlertsEnabled: Joi.boolean().required()
});

exports.form = waterAbstractionAlertsPreferenceForm;
exports.schema = waterAbstractionAlertsPreferenceSchema;
