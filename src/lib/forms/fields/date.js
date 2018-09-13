const dateFieldFactory = (name, opts = {}, value) => {
  const defaults = {
    label: '',
    widget: 'date',
    required: true,
    mapper: 'dateMapper'
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

module.exports = dateFieldFactory;
