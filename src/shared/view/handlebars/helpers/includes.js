'use strict';

/**
 * Splits a string to array, and gets the numbered segment
 */
const includes = (arr = [], options) => {
  const { value } = options.hash;
  if (arr.includes(value)) {
    return options.fn(this);
  }
  return options.inverse(this);
};

module.exports = includes;
