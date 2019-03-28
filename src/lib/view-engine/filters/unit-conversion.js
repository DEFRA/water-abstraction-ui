const { convertToCubicMetres } = require('../../unit-conversion.js');

const unitConversion = (value, unit) => {
  return convertToCubicMetres(value, unit);
};

module.exports = {
  unitConversion
};
