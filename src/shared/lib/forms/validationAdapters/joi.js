const Joi = require('joi');
const { mapFields } = require('../mapFields');
const { get } = require('lodash');

const getChoiceValues = field => field.options.choices.map(choice => choice.value);

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
      s = Joi.string().isoDate().options({ convert: false });
    }
    if (field.options.mapper === 'arrayMapper' && field.options.choices) {
      const values = getChoiceValues(field);
      s = Joi.array().items(Joi.string().valid(values));
    } else if (field.options.choices) {
      const values = getChoiceValues(field);
      s = s.valid(values);
    }
    if (field.options.required) {
      s = s.required();
    }
    schema[field.name] = s;
  });

  return schema;
};

const validate = (requestData, schema, options = { abortEarly: false }) => Joi.validate(requestData, schema, options);

/**
 * Formats error object from Joi into an easy format, and includes
 * custom error messages from the object provided
 * @param {Object} error - Joi error from schema.validate()
 * @param {Object} customErrors - custom error messages
 * @return {Array} formatted error messages
 */
const formatErrors = (error, customErrors) => {
  const details = get(error, 'details', []);

  return details.map(err => {
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

module.exports = {
  createSchemaFromForm,
  validate,
  formatErrors
};
