const commaNumber = require('comma-number');
const { maxPrecision } = require('../../number-formatter');

const number = (value) => {
  return commaNumber(maxPrecision(value, 3));
};

module.exports = {
  number
};
