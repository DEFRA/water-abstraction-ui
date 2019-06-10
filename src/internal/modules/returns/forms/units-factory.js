const { get } = require('lodash');
const { setValues, formFactory, fields } = require('shared/lib/forms');
const { STEP_UNITS, STEP_METER_UNITS, getPath } = require('../lib/flow-helpers');
const { isInternal } = require('../../../lib/permissions');

const choices = [
  { value: 'm³', label: 'Cubic metres' },
  { value: 'l', label: 'Litres' },
  { value: 'Ml', label: 'Megalitres' },
  { value: 'gal', label: 'Gallons' }
];

const getUnitsRadioButtons = () => {
  return fields.radio('units', {
    errors: {
      'any.required': {
        message: 'Select a unit of measurement'
      }
    },
    choices
  });
};

const getLabelText = request => {
  return isInternal(request)
    ? 'Which units were used?'
    : 'Which units are you using?';
};

const create = (options = {}) => {
  const { isMeterUnits } = options;

  const unitsForm = (request, data) => {
    const { csrfToken } = request.view;

    const action = getPath(isMeterUnits ? STEP_METER_UNITS : STEP_UNITS, request);
    const f = formFactory(action);

    f.fields.push(fields.paragraph(null, {
      text: getLabelText(request),
      element: 'h3',
      controlClass: 'govuk-heading-m'
    }));
    f.fields.push(getUnitsRadioButtons());
    f.fields.push(fields.button(null, { label: 'Continue' }));
    f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

    const values = get(data, 'reading', {});
    return setValues(f, values);
  };

  return unitsForm;
};

module.exports = { create };
