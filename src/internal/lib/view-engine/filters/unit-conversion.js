const { convertToCubicMetres } = require('../../unit-conversion');

const unitConversion = (value, unit) => {
  return convertToCubicMetres(value, unit);
};

module.exports = {
  unitConversion
};
