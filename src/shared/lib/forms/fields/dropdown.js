const dropdownFactory = (name, opts = {}, value) => {
  const defaults = {
    choices: [],
    label: '',
    widget: 'dropdown',
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

module.exports = dropdownFactory;
