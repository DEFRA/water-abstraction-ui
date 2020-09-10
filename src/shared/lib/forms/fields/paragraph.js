const paragraphFactory = (name, options = {}) => {
  const defaults = {
    widget: 'paragraph',
    text: ''
  };
  return {
    name,
    options: {
      ...defaults,
      ...options
    }
  };
};

module.exports = paragraphFactory;
