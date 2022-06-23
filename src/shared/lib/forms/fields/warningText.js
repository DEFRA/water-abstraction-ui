const warningTextFactory = (name, options = {}) => {
  const defaults = {
    widget: 'warning-text',
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

module.exports = warningTextFactory
