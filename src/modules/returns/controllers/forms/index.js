const Joi = require('joi');
const { cloneDeep, find } = require('lodash');
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
  return form.fields.reduce((acc, field) => {
    let s = Joi.string();

    if (field.options.choices) {
      s = s.valid(field.options.choices.map(choice => choice.value));
    }
    if (field.options.required) {
      s = s.required();
    }
    return {
      ...acc,
      [field.name]: s
    };
  }, {});
};

/**
 * Sets values on form fields
 * @param {Object} form - form object
 * @param {Object} values - key/value pairs
 * @return {Object} updated form object
 */
const setValues = (form, values) => {
  const f = cloneDeep(form);

  // Copy values to form
  for (let name in values) {
    const field = find(f.fields, { name });
    if (field) {
      field.value = values[name];
    }
  }

  return f;
};

/**
 * Import data from request to internal format
 * @param {Object} form - form description
 * @param {Object} POST/GET payload
 * @return {Object} payload mapped to internal formats
 */
const importData = (form, payload) => {
  return form.fields.reduce((acc, field) => {
    const mapper = field.options.mapper || 'defaultMapper';
    return {
      ...acc,
      [field.name]: mappers[mapper].import(field.name, payload)
    };
  }, {});
};

/**
 * Handles HTTP request on form object
 * @param {Object} form - form config object
 * @param {Object} request - HAPI HTTP request
 */
const handleRequest = (form, request) => {
  const f = cloneDeep(form);
  f.isSubmitted = true;
  const payload = f.method === 'POST' ? request.payload : request.query;
  const requestData = importData(f, payload);

  const schema = schemaFactory(form);

  const { error, value } = Joi.validate(requestData, schema, {
    abortEarly: false
  });

  if (error) {
    f.errors = error.details;

    // Copy errors to form
    for (let err of error.details) {
      const field = find(f.fields, {name: err.context.key});
      if (field) {
        field.errors.push(err);
      }
    }
  }

  f.isValid = !error;

  return setValues(f, value);
};

module.exports = {
  setValues,
  formFactory,
  handleRequest,
  fields,
  schemaFactory
};
