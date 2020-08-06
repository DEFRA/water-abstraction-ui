const linkFactory = (name, options = {}) => {
  const defaults = {
    widget: 'link',
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

module.exports = linkFactory;
