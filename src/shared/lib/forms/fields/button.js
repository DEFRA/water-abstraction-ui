const buttonFactory = (name, options = {}, value) => {
  const defaults = {
    widget: 'button',
    label: 'Submit'
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

module.exports = buttonFactory;
