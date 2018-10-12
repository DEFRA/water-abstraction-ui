const jsonSchema = require('jsonschema');
const { get } = require('lodash');

const validate = (requestData, schema) => {
  const result = jsonSchema.validate(requestData, schema);

  return {
    error: result.errors.length === 0 ? false : result,
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
  const { property, argument } = error;
  return property === 'instance' ? argument : property.replace('.instance', '');
};

/**
 * For a given JSON schema validation error, a standard
 * error object is returned containing the custom error
 * text, if available, else the default JSON schema validation
 * error text
 */
const getErrorMessages = (error, customErrors) => {
  const key = getErrorKey(error);
  const customError = customErrors[key];

  if (customError && customError[error.name]) {
    const { summary, message } = customError[error.name];
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
 * Copies the errors to the local form field level if
 * there is an error from that field
 */
const applyLocalErrors = (form, errors) => {
  form.fields.forEach(field => {
    field.errors = errors.filter(error => error.name === field.name);
  });
  return form;
};

/**
 * Apply the JSON schema validation object result to the
 * form errors if there are any.
 *
 * form: The form object
 * error: The JSON schema validation result. { errors: [] }
 * customErrors: Any custom error text for the form
 */
const applyErrors = (form, error, customErrors) => {
  const errors = get(error, 'errors');

  if (!errors) {
    return form;
  }

  const validationErrors = errors.map(err => formatError(err, customErrors));
  form.errors = validationErrors;
  return applyLocalErrors(form, validationErrors);
};

module.exports = {
  validate,
  createSchemaFromForm,
  applyErrors
};
