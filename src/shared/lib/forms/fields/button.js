const buttonFactory = (name, options = {}, value) => {
  const defaults = {
    widget: 'button',
    label: 'Submit',
    isStartButton: false
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
