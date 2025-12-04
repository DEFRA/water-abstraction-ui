const insertTextFactory = (name, options = {}) => {
  const defaults = {
    widget: 'insert-text',
    text: ''
  }
  return {
    name,
    options: {
      ...defaults,
      ...options
    }
  }
}

module.exports = insertTextFactory
