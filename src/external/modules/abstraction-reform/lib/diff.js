const { isEmpty, isEqual } = require('lodash');

/**
 * Compares two objects, and returns any items that are new or have changed in the
 * second comparison object
 * @param  {Object} base       - base object
 * @param  {Object} comparison - comparison object (e.g. posted data )
 * @return {Object}            - returns new / updated items
 */
const diff = (base, comparison) => {
  const changes = Object.keys(comparison).reduce((acc, key) => {
    if ((!(key in base)) || !isEqual(base[key], comparison[key])) {
      acc[key] = comparison[key];
    }
    return acc;
  }, {});
  return isEmpty(changes) ? null : changes;
};

module.exports = {
  diff
};
