// contains generic functions unrelated to a specific component
const isArray = require('lodash/isArray');

/**
 * Force value to be array
 * @param {Mixed} val - the value
 * @return {Array} the value wrapped in array
 */
function forceArray (val) {
  if (val === null || val === undefined) {
    return [];
  }
  return isArray(val) ? val : [val];
}

exports.forceArray = forceArray;
