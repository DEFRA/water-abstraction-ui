const radioFieldFactory = (name, opts = {}, value) => {
  const defaults = {
    choices: [],
    label: '',
    widget: 'radio',
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

module.exports = radioFieldFactory;
