const { cloneDeep } = require('lodash');
const fields = require('./fields');
const mappers = require('./mappers');
const { mapFields } = require('./mapFields');
const validationAdapterFactory = require('./validationAdapters');

/**
 * Creates the form skeleton which will have fields added to.
 *
 * @param {string} action URL for handling the submission of the form
 * @param {string} method='POST' Which HTTP method will be used to handle the form submit
 * @param {string} validationType='joi' Which type of validation adapter is used for form validation and error messages
 */
const formFactory = (action, method = 'POST', validationType = 'joi') => {
  return {
    action,
    method,
    isSubmitted: false,
    isValid: undefined,
    fields: [],
    errors: [],
    validationType
  };
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

const getPayload = (form, request) => form.method === 'POST'
  ? request.payload
  : request.query;

/**
 * Handles HTTP request on form object
 * @param {Object} form - form config object
 * @param {Object} request - HAPI HTTP request
 */
const handleRequest = (form, request, validationSchema) => {
  const adapter = validationAdapterFactory.load(form.validationType);
  let f = cloneDeep(form);
  f.isSubmitted = true;
  const payload = getPayload(form, request);
  const requestData = importData(f, payload);

  const schema = validationSchema || adapter.createSchemaFromForm(form);

  // Perform Joi validation on form data
  const { error, value } = adapter.validate(requestData, schema, {
    abortEarly: false
  });

  request.log('info', JSON.stringify(error, null, 2));

  f = adapter.applyErrors(f, error, getCustomErrors(form));
  f.isValid = !error;

  return setValues(f, value);
};

module.exports = {
  setValues,
  getValues,
  formFactory,
  handleRequest,
  fields,
  importData
};
