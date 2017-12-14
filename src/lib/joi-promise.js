/**
 * A thin wrapper around Joi.validate method to support promises
 * This allows tidier method chaining in async code
 * @module lib/joi-promise
 */
const Joi = require('joi');

/**
 * Validate an object against a Joi schema
 * @param {Object} value - the data to validate
 * @param {Object} schema - the schema to validate the data against
 * @param {Object} [options] - additional options - see Joi docs
 * @return {Promise} - resolves with value, or throws validation error
 */
module.exports = function() {
  const args = arguments;
  return new Promise((resolve, reject) => {
    const {error, value} = Joi.validate.apply(this, args);

    if(error) {
      throw error;
    }
    else {
      resolve(value);
    }
  });
};
