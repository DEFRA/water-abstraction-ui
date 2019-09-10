'use strict';

const concat = function () {
  const arg = Array.prototype.slice.call(arguments, 0);
  arg.pop();
  return arg.join('');
};

module.exports = concat;
