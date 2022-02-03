// check boxes with conditional fields
const factory = (name, opts = {}, value) => {
  const defaults = {
    choices: [],
    label: '',
    widget: 'checkboxes',
    required: true
  };
  const options = {
    ...defaults,
    ...opts
  };
  return {
    name,
    value,
    options,
    errors: []
  };
};

module.exports = factory;
