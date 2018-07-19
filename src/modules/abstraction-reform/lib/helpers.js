const { pickBy, isArray, isObject, mapValues, pick } = require('lodash');
const deepMap = require('deep-map');

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
 * Convert 'null' or '' string to real null
 * @param {Object} data
 * @return {Object} with any 'null' converted to null
 */
const transformNulls = (data) => {
  return deepMap(data, (val) => {
    // Convert string null to real null
    if (typeof (val) === 'string' && (val === '' || val === 'null')) {
      return null;
    }
    return val;
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

/**
 * Given an object and a JSON schema, returns only the properties in the
 * object that are defined in the 'properties' section of the JSON schema
 * @param {Object} object - the data object
 * @param {Object} schema - JSON schema
 * @return {Object}
 */
const extractData = (object, schema) => {
  return pick(object, Object.keys(schema.properties));
};

module.exports = {
  filterScalars,
  generateJsonSchema,
  extractData,
  transformNulls
};
