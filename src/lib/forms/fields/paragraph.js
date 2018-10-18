const paragraphFactory = (name, options = {}, value) => {
  const defaults = {
    widget: 'paragraph',
    text: ''
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

module.exports = paragraphFactory;
