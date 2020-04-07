const pluralize = require('pluralize');
const { isArray, isNumber } = require('lodash');

/**
 * Conditionally pluralizes string passed in as 'value'
 * The second argument can be a boolean, or an array
 * If array, pluralization depends on number of items in array
 * @param  {String}  value      - word to pluralize
 * @param  {Boolean|Array|Number} [arg=true] - boolean, array or number to determine whether to pluralize
 * @return {String}             - pluralized version of value
 */
const pluralizeFilter = (value, arg = true) => {
  const flags = [
    arg === true,
    isArray(arg) && arg.length !== 1,
    isNumber(arg) && arg !== 1
  ];
  return flags.includes(true) ? pluralize(value) : value;
};

module.exports = {
  pluralize: pluralizeFilter
};
