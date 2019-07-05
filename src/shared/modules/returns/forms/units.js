const { fields } = require('shared/lib/forms');

const choices = [
  { value: 'm³', label: 'Cubic metres' },
  { value: 'l', label: 'Litres' },
  { value: 'Ml', label: 'Megalitres' },
  { value: 'gal', label: 'Gallons' }
];

const getUnitsField = () => fields.radio('units', {
  errors: {
    'any.required': {
      message: 'Select a unit of measurement'
    }
  },
  choices
});

exports.getUnitsField = getUnitsField;
