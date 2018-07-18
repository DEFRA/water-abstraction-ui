const { pickBy, isArray, isObject } = require('lodash');

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

module.exports = {
  filterScalars
};
