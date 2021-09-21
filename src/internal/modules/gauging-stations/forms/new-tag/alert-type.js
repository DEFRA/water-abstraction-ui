const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../../lib/session');

const newTagAlertTypeForm = request => {
  const f = formFactory(request.path);

  const defaultAlertType = get(session.get(request), 'alertType.value');
  const defaultVolumeLimitedSelection = get(session.get(request), 'volumeLimited.value');

  f.fields.push(fields.radio('alertType', {
    errors: {
      'any.required': {
        message: 'Select if the licence holder needs to stop or reduce'
      }
    },
    choices: [{
      value: 'stop',
      label: 'Stop'
    }, {
      value: 'reduce',
      label: 'Reduce',
      fields: [fields.radio('volumeLimited', {
        label: 'Does the licence holder need to stop abstraction when they reach a certain amount?',
        hint: 'For example, you must not exceed 4000Ml in total from the start of your abstraction period.',
        errors: {
          'any.required': {
            message: 'Select if the licence holder needs to stop abstraction when they reach a certain amount'
          }
        },
        choices: [{
          value: true,
          label: 'Yes'
        }, {
          value: false,
          label: 'No'
        }]
      }, defaultVolumeLimitedSelection)]
    }]
  }, defaultAlertType));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const newTagAlertTypeSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  alertType: Joi.string().required().allow('stop', 'reduce'),
  volumeLimited: Joi.boolean().when(
    'alertType',
    {
      is: 'reduce',
      then: Joi.boolean().required()
    }
  )
});

exports.form = newTagAlertTypeForm;
exports.schema = newTagAlertTypeSchema;
