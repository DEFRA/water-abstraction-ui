const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const validUnits = ['Ml/d', 'm3/s', 'm3/d', 'l/s', 'mAOD', 'mASD', 'm'];
const session = require('../lib/session');

const thresholdAndUnitForm = request => {
  const f = formFactory(request.path);

  const defaultThreshold = get(session.get(request), 'threshold.value');
  f.fields.push(fields.text('threshold', {
    label: 'Threshold',
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'any.empty': {
        message: 'Enter a valid threshold'
      },
      'any.required': {
        message: 'Enter a valid threshold'
      }
    }
  }, defaultThreshold));

  const defaultUnit = get(session.get(request), 'unit.value');

  f.fields.push(fields.dropdown('unit', {
    label: 'Unit',
    errors: {
      'any.empty': {
        message: 'Select a valid unit'
      },
      'any.required': {
        message: 'Select a valid unit'
      }
    },
    choices: validUnits.map(n => {
      return {
        value: n,
        label: n
      };
    })
  }, defaultUnit));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const thresholdAndUnitSchema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  threshold: Joi.number().required(),
  unit: Joi.string().required().allow(validUnits)
});

exports.form = thresholdAndUnitForm;
exports.schema = thresholdAndUnitSchema;
