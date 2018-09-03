const deepMap = require('deep-map');
const { pickBy, isArray, isObject, mapValues, pick } = require('lodash');
const { getPurposes, getPoints, getConditions } = require('./licence-helpers');

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

/**
 * Prepares data for use in single licence view
 * @param {Object} licence - the base licence
 * @param {Object} finalState - the final state from the reducer
 * @return {Object} view data
 */
const prepareData = (licence, finalState) => {
  // Prepare licence
  const base = {
    base: filterScalars(licence.licence_data_value),
    reform: filterScalars(finalState.licence)
  };

  // Prepare purposes
  // @TODO - we will need to compare to check for deleted/added items
  const purposes = getPurposes(licence.licence_data_value).map((purpose, index) => {
    return {
      base: filterScalars(purpose),
      reform: filterScalars(getPurposes(finalState.licence)[index])
    };
  });

  // Prepare points
  const points = getPoints(licence.licence_data_value).map((point, index) => {
    return {
      base: filterScalars(point),
      reform: filterScalars(getPoints(finalState.licence)[index])
    };
  });

  // Conditions
  const conditions = getConditions(licence.licence_data_value).map((condition, index) => {
    return {
      base: filterScalars(condition),
      reform: filterScalars(getConditions(finalState.licence)[index])
    };
  });

  return {
    licence: base,
    purposes,
    points,
    conditions,
    notes: finalState.notes
  };
};

module.exports = {
  filterScalars,
  generateJsonSchema,
  extractData,
  transformNulls,
  prepareData
};
