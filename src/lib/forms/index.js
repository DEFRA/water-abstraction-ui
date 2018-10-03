const Joi = require('joi');
const { cloneDeep, isObject } = require('lodash');
const fields = require('./fields');
const mappers = require('./mappers');

const formFactory = (action, method = 'POST') => {
  return {
    action,
    method,
    isSubmitted: false,
    isValid: undefined,
    fields: [],
    errors: []
  };
};

/**
 * Generates a Joi validation schema given a form schema
 * @param {Object} form
 * @return {Object} Joi schema
 */
const schemaFactory = (form) => {
  const schema = {};

  mapFields(form, (field) => {
    let s = Joi.string();

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

/**
 * Sets values on form fields
 * @param {Object} form - form object
 * @param {Object} values - key/value pairs
 * @return {Object} updated form object
 */
const setValues = (form, values) => {
  return mapFields(form, (field) => {
    const { name, value, ...rest } = field;

    const newValue = name in values ? values[name] : value;

    return {
      name,
      ...rest,
      value: newValue
    };
  });
};

/**
 * Recursively get all values from form
 * @param {Object} form
 * @return {Object}
 */
const getValues = (form) => {
  const values = {};
  mapFields(form, (field) => {
    if (field.name) {
      values[field.name] = field.value;
    }
    return field;
  });
  return values;
};

/**
 * Given a form object, gets all custom error messages as a flat key/value
 * object
 * @param {Object} form
 * @return {Object} custom errors objects
 */
const getCustomErrors = (form) => {
  const errors = {};
  mapFields(form, (field) => {
    if (field.name && field.options.errors) {
      errors[field.name] = field.options.errors;
    }
    return field;
  });
  return errors;
};

/**
 * Applies the supplied function to every field
 * using a deep traversal
 * Mutates the supplied object
 */
const map = (f, fn) => {
  const form = cloneDeep(f);
  if (isObject(form)) {
    if ('fields' in form) {
      form.fields = form.fields.map(fn);
    }
    for (let key in form) {
      if (isObject(form[key])) {
        form[key] = map(form[key], fn);
      }
    }
  }
  return form;
};

/**
 * Finds all fields in form, and applies the supplied function
 * to that field
 */
const mapFields = (form, fn) => {
  const f = cloneDeep(form);
  return map(f, fn);
};

/**
 * Import data from request to internal format, passing through mappers
 * @param {Object} form - form description
 * @param {Object} POST/GET payload
 * @return {Object} payload mapped to internal formats
 */
const importData = (form, payload) => {
  const data = {};
  mapFields(form, (field) => {
    if (field.name) {
      const mapper = field.options.mapper || 'defaultMapper';
      data[field.name] = mappers[mapper].import(field.name, payload);
    }
    return field;
  });
  return data;
};

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
 * @return {Object} form with errors populated on fields
 */
const applyErrors = (form, error) => {
  if (!error) {
    return form;
  }

  // Get array of error messages with custom error messaging
  const formattedErrors = formatErrors(error, getCustomErrors(form));

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

/**
 * Handles HTTP request on form object
 * @param {Object} form - form config object
 * @param {Object} request - HAPI HTTP request
 */
const handleRequest = (form, request, joiSchema) => {
  let f = cloneDeep(form);
  f.isSubmitted = true;
  const payload = f.method === 'POST' ? request.payload : request.query;
  const requestData = importData(f, payload);

  const schema = joiSchema || schemaFactory(form);

  // Perform Joi validation on form data
  const { error, value } = Joi.validate(requestData, schema, {
    abortEarly: false
  });

  console.log(JSON.stringify(error, null, 2));

  f = applyErrors(f, error);
  f.isValid = !error;

  return setValues(f, value);
};

module.exports = {
  setValues,
  getValues,
  formFactory,
  handleRequest,
  fields,
  schemaFactory,
  importData
};
