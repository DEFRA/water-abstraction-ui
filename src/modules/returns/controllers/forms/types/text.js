const Base = require('./base');

class Text extends Base {
  constructor (name, label, options = {}) {
    const defaults = {
      type: 'text',
      widget: 'text'
    };
    super(name, label, { ...defaults, ...options });
  }

  getView () {
    const { name, label, options } = this;
    return {
      name,
      label,
      options
    };
  }
}

module.exports = Base;
