const Joi = require('joi');
const { cloneDeep, find } = require('lodash');
const fields = require('./fields');

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
      s = s.valid(field.options.choices);
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
 * Handles HTTP request on form object
 * @param {Object} form - form config object
 * @param {Object} request - HAPI HTTP request
 */
const handleRequest = (form, request) => {
  const f = cloneDeep(form);
  f.isSubmitted = true;
  const payload = f.method === 'POST' ? request.payload : request.query;

  const schema = schemaFactory(form);

  const { error, value } = Joi.validate(payload, schema, {
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

  // Copy values to form
  for (let name in value) {
    const field = find(f.fields, {name});
    if (field) {
      field.value = value[name];
    }
  }

  return f;
};

module.exports = {
  formFactory,
  handleRequest,
  fields,
  schemaFactory
};
