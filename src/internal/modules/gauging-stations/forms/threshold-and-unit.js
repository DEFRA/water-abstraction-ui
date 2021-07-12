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
      'number.base': {
        message: 'Enter a number in digits and no other characters other than a decimal point'
      },
      'number.max': {
        message: 'Enter a number no more than 1,000,000'
      },
      'number.min': {
        message: 'Enter a number more than zero'
      }
    }
  }, defaultThreshold));

  const defaultUnit = get(session.get(request), 'unit.value');

  f.fields.push(fields.dropdown('unit', {
    label: 'Unit of measurement',
    errors: {
      'string.empty': {
        message: 'Select a unit of measurement'
      },
      'any.required': {
        message: 'Select a unit of measurement'
      }
    },
    choices: [{
      value: null,
      label: 'Select an option'
    }, ...validUnits.map(n => {
      return {
        value: n,
        label: n
      };
    })]
  }, defaultUnit));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const thresholdAndUnitSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  threshold: Joi.number().min(0).max(1000000).required(),
  unit: Joi.string().required().allow(validUnits)
});

exports.form = thresholdAndUnitForm;
exports.schema = thresholdAndUnitSchema;
