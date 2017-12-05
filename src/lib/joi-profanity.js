/**
 * A profanity validator extension for Joi validation library
 * @module lib/joi-profanity
 */
const profanity = require('profanity-util');

/**
 * A Joi extension to test for profanity
 * @param {Object} joi - the base Joi implementation
 * @return {Object} joi extension
 * @example
 *   const Joi = require('joi');
 *   const CustomJoi = Joi.extend(joiProfanity)
 */
module.exports = (joi) => ({
    base: joi.string(),
    name: 'string',
    language: {
        profanity: 'cannot contain profanity', // Used below as 'number.round'
    },
    rules: [
        {
            name: 'profanity',
            validate(params, value, state, options) {

              const list = profanity.check(value);

              if(list.length > 0) {
                // Generate an error, state and options need to be passed
                return this.createError('string.profanity', { v: value }, state, options);
              }

              return value; // Everything is OK
            }
        }
    ]
});
