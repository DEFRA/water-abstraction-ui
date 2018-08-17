const Joi = require('joi');
const Base = require('./base');

class Radio extends Base {
  constructor (name, label, choices, options) {
    const defaults = {
      choices,
      required: true,
      widget: 'radio'
    };

    super(name, label, {...defaults, ...options});
  }

  /**
   * Gets Joi validator for this field
   * @return {Object}
   */
  getSchema () {
    const validation = Joi.string().valid(this.options.choices);
    return this.options.required ? validation.required() : validation;
  }
}

module.exports = Radio;
