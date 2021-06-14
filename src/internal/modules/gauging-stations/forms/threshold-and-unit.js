const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const validUnits = ['Ml/d', 'm3/s', 'm3/d', 'l/s', 'mAOD', 'mASD', 'm'];

const thresholdAndUnitForm = request => {
  const f = formFactory(request.path);

  f.fields.push(fields.text('selectedThreshold', {
    label: 'Threshold',
    controlClass: 'govuk-input govuk-input--width-10'
  }));
  f.fields.push(fields.dropdown('selectedUnit', {
    label: 'Unit',
    errors: {
      'any.required': {
        message: 'Enter the required input values'
      }
    },
    choices: validUnits.map(n => {
      return {
        value: n,
        label: n
      };
    })
  }));

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
