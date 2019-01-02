const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

const { get } = require('lodash');

const validate = (requestData, schema) => {
  const validator = ajv.compile(schema);
  const isValid = validator(requestData);

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
  return get(error, 'dataPath').replace(/^\./, '');
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
  formatErrors
};
