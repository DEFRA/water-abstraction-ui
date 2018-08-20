const Base = require('./base');

class Hidden extends Base {
  constructor (name, options = {}) {
    const defaults = {
      type: 'hidden',
      widget: 'text'
    };
    const label = null;
    super(name, label, { ...defaults, ...options });
  }

  // getView () {
  //   const { name, label, options } = this;
  //   return {
  //     name,
  //     label,
  //     options
  //   };
  // }
}

module.exports = Hidden;
