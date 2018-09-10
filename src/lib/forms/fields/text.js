const textFactory = (name, opts = {}, value) => {
  const defaults = {
    label: '',
    widget: 'text',
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

module.exports = textFactory;
