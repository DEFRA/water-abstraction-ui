const Joi = require('joi');
const { mapFields } = require('../mapFields');

/**
 * Generates a Joi validation schema given a form schema
 * @param {Object} form
 * @return {Object} Joi schema
 */
const createSchemaFromForm = form => {
  const schema = {};

  mapFields(form, (field) => {
    let s = Joi.string();

    if (field.options.mapper === 'booleanMapper') {
      s = Joi.boolean();
    }
    if (field.options.mapper === 'dateMapper') {
      s = Joi.date().iso();
    }
    if (field.options.choices) {
      s = s.valid(field.options.choices.map(choice => choice.value));
    }
    if (field.options.required) {
      s = s.required();
    }
    schema[field.name] = s;
  });

  return schema;
};

const validate = (requestData, schema, options) => Joi.validate(requestData, schema, options);

/**
 * Formats error object from Joi into an easy format, and includes
 * custom error messages from the object provided
 * @param {Object} error - Joi error from schema.validate()
 * @param {Object} customErrors - custom error messages
 * @return {Array} formatted error messages
 */
const formatErrors = (error, customErrors) => {
  return error.details.map(err => {
    const name = err.context.key;
    const { type, message } = err;

    // Use custom error messages
    if ((name in customErrors) && (type in customErrors[name])) {
      const custom = customErrors[name][type];
      return {
        name,
        message: custom.message,
        summary: custom.summary || custom.message
      };
    }

    // Use default Joi message
    return {
      name,
      message,
      summary: message
    };
  });
};

/**
 * Applies Joi errors to fields and returns a new form object
 * @param {Object} form
 * @param {Array} error - returned from Joi.validate()
 * @param {Object} customErrors - any custom form errors as a flat key/value object.
 * @return {Object} form with errors populated on fields
 */
const applyErrors = (form, error, customErrors) => {
  if (!error) {
    return form;
  }

  // Get array of error messages with custom error messaging
  const formattedErrors = formatErrors(error, customErrors);

  const f = mapFields(form, (field) => {
    const errors = formattedErrors.filter(err => {
      return err.name === field.name;
    });
    return {
      ...field,
      errors
    };
  });
  f.errors = formattedErrors;
  return f;
};

module.exports = {
  createSchemaFromForm,
  validate,
  applyErrors
};
