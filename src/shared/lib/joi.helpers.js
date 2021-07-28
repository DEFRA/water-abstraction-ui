'use strict';

const Joi = require('joi');
const { isObject } = require('lodash/lang');

/**
 * Creates a Joi schema and applies defaults to it
 * This allows us to apply options to Joi globally
 * @param {Object} schema - an object of Joi rules
 * @param {Object} [options] - an object of option overrides
 * @returns {Object} - a Joi schema
 */
const createSchema = (schema = {}, options = {}) => {
  if (!isObject(schema)) throw new Error('Invalid schema type, should be plain object or existing joi schema');

  const isValidSchema = Joi.isSchema(schema);
  const schemaOptions = {
    abortEarly: false,
    ...options
  };

  return isValidSchema ? schema.options(schemaOptions) : Joi.object().options(schemaOptions).keys(schema);
};

exports.createSchema = createSchema;
