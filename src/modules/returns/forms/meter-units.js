const Joi = require('joi');
const { setValues, formFactory, fields } = require('../../../lib/forms');

const choices = [
  { value: 'm³', label: 'Cubic metres' },
  { value: 'l', label: 'Litres' },
  { value: 'Ml', label: 'Megalitres' },
  { value: 'gal', label: 'Gallons' }
];

const form = (request, data) => {
  const { csrfToken } = request.view;
  const isInternal = request.permissions.hasPermission('admin.defra');
  const action = `${isInternal ? '/admin' : ''}/return/meter/units`;

  const f = formFactory(action);

  f.fields.push(fields.radio('units', {
    label: 'What units does your meter use?',
    errors: {
      'any.required': {
        message: 'Select a unit of measurement',
        summary: 'Select a unit of measurement'
      }
    },
    choices
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return setValues(f, data.reading);
};

const schema = {
  units: Joi.string().valid(choices.map(choice => choice.value)).required(),
  csrf_token: Joi.string().guid().required()
};

module.exports = {
  meterUnitsForm: form,
  meterUnitsSchema: schema
};
