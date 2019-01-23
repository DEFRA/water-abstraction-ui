const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, errorDataPath: 'property' });

const { get, set } = require('lodash');

/**
 * Gets a map of where the flattened form field values should be placed
 * within the nested object being validated by JSON schema
 * @param  {Object} schema    - the JSON schema object
 * @param  {Object} [map={}]  - the map being created
 * @param  {String} [path=''] - the path prefix
 * @return {Object}           returns the map
 */
const getPathMap = (schema, map = {}, path = '') => {
  for (let key in schema.properties) {
    if (schema.properties[key].properties) {
      getPathMap(schema.properties[key], map, key + '.');
    } else {
      map[key] = path + key;
    }
  }
  return map;
};

/**
 * Converts empty strings or nulls to undefined
 * @param  {Mixed} value
 * @return {Mixed} returns undefined for empty string
 */
const mapValue = (value) => {
  if (value === '' || value === null) {
    return undefined;
  }
  return value;
};

/**
 * Maps the data received from the HTTP request to an object which will be
 * validated against the JSON schema.
 * Empty strings are mapped to undefined, and nested properties are placed
 * in the correct position within the object structure
 * @param  {Object} data   - Data received from HTML form post
 * @param  {Object} schema - JSON schema
 * @return {Object}        data ready for testing against JSON schema
 */
const mapRequestData = (data, schema) => {
  const map = getPathMap(schema);
  const obj = {};
  for (let key in data) {
    if (key in map) {
      set(obj, map[key], mapValue(data[key]));
    }
  }
  return obj;
};

/**
 * Validates HTTP request data from HTML form against supplied JSON schema
 * @param  {Object} requestData - data posted from HTTP request
 * @param  {Object} schema      - JSON schema
 * @return {Object}             validation result for form library
 */
const validate = (requestData, schema) => {
  const validator = ajv.compile(schema);
  const isValid = validator(mapRequestData(requestData, schema));

  return {
    error: isValid ? false : { errors: validator.errors },
    value: requestData
  };
};

const createSchemaFromForm = () => {
  throw new Error('Forms are generated from schemas so not necessary to regenerate back from the form');
};

/**
 * Determines the error key by inspecting the contents of
 * the JSON schema validation error.
 */
const getErrorKey = error => {
  if (error.keyword === 'required') {
    return get(error, 'params.missingProperty');
  }
  return get(error, 'dataPath').split('.').pop();
};

/**
 * For a given JSON schema validation error, a standard
 * error object is returned containing the custom error
 * text, if available, else the default JSON schema validation
 * error text
 */
const getErrorMessages = (error, customErrors = {}) => {
  const key = getErrorKey(error);
  const customError = customErrors[key];

  if (customError && customError[error.keyword]) {
    const { summary, message } = customError[error.keyword];
    return { message, summary: summary || message };
  }

  return { message: error.message, summary: error.message };
};

const formatError = (error, customErrors) => {
  const formattedError = {
    name: getErrorKey(error),
    ...getErrorMessages(error, customErrors)
  };
  return formattedError;
};

/**
 * Given the JSON schema validator result, format the errors into a common
 * shape overlaying any custom error messages where applicable.
 *
 * error: The JSON schema validation result. { errors: [] }
 * customErrors: Any custom error text for the form
 */
const formatErrors = (error, customErrors) => {
  const errors = get(error, 'errors', []);
  return errors.map(err => formatError(err, customErrors));
};

module.exports = {
  validate,
  createSchemaFromForm,
  formatErrors,
  getPathMap,
  mapValue,
  mapRequestData
};
