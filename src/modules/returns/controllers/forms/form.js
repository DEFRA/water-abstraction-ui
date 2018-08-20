const Joi = require('joi');
const { find } = require('lodash');

class Form {
  constructor (options = {}) {
    const defaults = {
      method: 'POST',
      action: '/'
    };

    this.config = { ...defaults, ...options };
    this.errors = null;
    this.fields = [];
    this.schema = {};
    this.values = {};
    this.isSubmitted = false;
    this.plugins = [];
  }

  /**
   * Add a field
   * @param {Object} field object
   * @return {this}
   */
  add (field) {
    this.fields.push(field);
    return this;
  }

  /**
   * Adds a plugin to the form
   * @param {Object} plugin
   */
  addPlugin (plugin) {
    plugin.register(this);
    this.plugins.push(plugin);
    return this;
  }

  /**
   * Gets view data
   */
  getView () {
    const { config, errors, isSubmitted } = this;
    const fields = this.fields.map(field => {
      const view = field.getView();
      return {
        ...view,
        value: this.values[view.name]
      };
    });

    return {
      config,
      errors,
      fields,
      isSubmitted
    };
  }

  // /**
  //  * Sets values without any validation
  //  * @param {Object} data
  //  * @return {this}
  //  */
  // setValues (data) {
  //   this.values = data;
  //   return this;
  // }

  /**
   * Sets a value on a field, bypassing validation
   * @param {String} name - field name
   * @param {Mixed} value
   */
  set (name, value) {
    console.log('Setting', name, value);
    let field = this.find(name);
    if (field) {
      field.setValue(value);
    }
  }

  /**
   * Finds a field by name
   * @param {String} name
   * @return {Object} field instance
   */
  find (name) {
    return find(this.fields, {name});
  }

  /**
   * Gets Joi schema validation for the form
   */
  getSchema () {
    return this.fields.reduce((acc, field) => {
      acc[field.name] = field.getValidator();
    }, {});
  }

  handleRequest (request) {
    this.isSubmitted = true;
    const payload = this.config.method === 'POST' ? request.payload : request.query;
    const { error, value } = Joi.validate(payload, this.schema);
    this.payload = value;

    console.error(error);
  }
}

module.exports = Form;
