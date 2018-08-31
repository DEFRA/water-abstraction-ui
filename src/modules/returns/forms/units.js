const { formFactory, fields } = require('../../../lib/forms');

const unitsForm = (request) => {
  const { csrfToken } = request.view;
  const action = `/admin/return/units`;

  const f = formFactory(action);

  f.fields.push(fields.radio('units', {
    label: 'What is the unit of measurement?',
    choices: [
      { value: 'm3', label: 'Cubic metres' },
      { value: 'l', label: 'Litres' },
      { value: 'Ml', label: 'Megalitres' },
      { value: 'gal', label: 'Gallons' }
    ]}));

  f.fields.push(fields.button());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = unitsForm;
