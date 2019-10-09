'use strict';

const notNull = function (param, options) {
  if (param !== null) {
    return options.fn(this);
  }
};

module.exports = notNull;
