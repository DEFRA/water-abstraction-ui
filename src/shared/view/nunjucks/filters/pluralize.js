const pluralize = require('pluralize');
const { isArray } = require('lodash');

/**
 * Conditionally pluralizes string passed in as 'value'
 * The second argument can be a boolean, or an array
 * If array, pluralization depends on number of items in array
 * @param  {String}  value      - word to pluralize
 * @param  {Boolean|Array} [arg=true] - boolean or array to determine whether to pluralize
 * @return {String}             - pluralized version of value
 */
const pluralizeFilter = (value, arg = true) => {
  const isPlural = (arg === true) | (isArray(arg) && arg.length !== 1);
  return isPlural ? pluralize(value) : value;
};

module.exports = {
  pluralize: pluralizeFilter
};
