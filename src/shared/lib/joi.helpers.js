'use strict';

const Joi = require('joi');

/**
 * Creates a Joi schema and applies defaults to it
 * This allows us to apply options to Joi globally
 * @param {Object} schema - an object of Joi rules
 * @param {Object} [options] - an object of option overrides
 * @returns {Object} - a Joi schema
 */
const createSchema = (schema = {}, options = {}) => {
  const isValidSchema = Joi.isSchema(schema);

  const schemaOptions = {
    abortEarly: false,
    ...options
  };

  return isValidSchema ? schema.options(schemaOptions) : Joi.object().options(schemaOptions).keys(schema);
};

exports.createSchema = createSchema;
