const { get } = require('lodash');
const { setValues, formFactory, fields } = require('../../../lib/forms');
const { STEP_UNITS, STEP_METER_UNITS, getPath } = require('../lib/flow-helpers');

const choices = [
  { value: 'm³', label: 'Cubic metres' },
  { value: 'l', label: 'Litres' },
  { value: 'Ml', label: 'Megalitres' },
  { value: 'gal', label: 'Gallons' }
];

const getUnitsRadioButtons = label => {
  return fields.radio('units', {
    label,
    errors: {
      'any.required': {
        message: 'Select a unit of measurement'
      }
    },
    choices
  });
};

const create = (options = {}) => {
  const { labelText, isMeterUnits } = options;

  const unitsForm = (request, data) => {
    const { csrfToken } = request.view;

    const action = getPath(isMeterUnits ? STEP_METER_UNITS : STEP_UNITS, request);
    const f = formFactory(action);

    f.fields.push(getUnitsRadioButtons(labelText));
    f.fields.push(fields.button(null, { label: 'Continue' }));
    f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

    const values = get(data, 'reading', {});
    return setValues(f, values);
  };

  return unitsForm;
};

module.exports = { create };
