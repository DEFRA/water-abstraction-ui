const { pickBy, isArray, isObject, mapValues } = require('lodash');

/**
 * Returns obj with non-scalar values removed
 * @param {Object} obj
 * @return {Object}
 */
const filterScalars = (obj) => {
  return pickBy(obj, (val) => {
    return !(isArray(val) || isObject(val));
  });
};

/**
 * A function that generates a simple JSON schema as a starting point for the supplied object
 * all fields are set to strings
 * @param {Object} obj
 * @return {Object} JSON schema
 */
const generateJsonSchema = (obj) => {
  const schema = {
    type: 'object',
    properties: mapValues(obj, (value) => {
      return {
        type: 'string'
      };
    })
  };

  return schema;
};

module.exports = {
  filterScalars,
  generateJsonSchema
};
