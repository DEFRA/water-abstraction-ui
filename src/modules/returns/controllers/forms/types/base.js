const Joi = require('joi');

class Base {
  constructor (name, label, options = {}) {
    this.name = name;
    this.label = label;
    this.options = options;
    this.value = undefined;
  }

  setValue (value) {
    console.log('set!', value);
    this.value = value;
    return this;
  }

  getValue (value) {
    return this.value;
  }

  getValidator () {
    return Joi.string();
  }

  getView () {
    const { name, label, options, value } = this;
    return { name, label, options, value };
  }
}

module.exports = Base;
