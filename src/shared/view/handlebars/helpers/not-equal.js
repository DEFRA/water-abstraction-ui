'use strict';

const notEqual = function (v1, v2, options) {
  return (v1 === v2) ? options.inverse(this) : options.fn(this);
};

module.exports = notEqual;
