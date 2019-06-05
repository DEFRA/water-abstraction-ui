const hiddenFieldFactory = (name, options = {}, value) => {
  const defaults = {
    widget: 'text',
    type: 'hidden',
    label: null,
    required: true
  };
  return {
    name,
    value,
    options: {
      ...defaults,
      ...options
    }
  };
};

module.exports = hiddenFieldFactory;
