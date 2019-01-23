const factory = (name, opts = {}, value) => {
  const defaults = {
    label: '',
    widget: 'checkbox',
    checked: false,
    mapper: 'arrayMapper'
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
