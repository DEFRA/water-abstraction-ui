const Joi = require('joi');

class Base {
  constructor (name, label, options = {}) {
    this.name = name;
    this.label = label;
    this.options = options;
  }

  getValidator () {
    return Joi.string();
  }

  getView () {
    const { name, label, options } = this;
    return { name, label, options };
  }
}

module.exports = Base;
