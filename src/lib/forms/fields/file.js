const fileFactory = (name, opts = {}, value) => {
  const defaults = {
    label: '',
    widget: 'file',
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

module.exports = fileFactory;
