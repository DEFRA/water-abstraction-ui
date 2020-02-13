const commaNumber = require('comma-number');

/**
 * Formats an integer charge value in pence
 * @param {Number} value - charge as an integer in pence
 * @return {String} formatted number with £ prefix
 */
const charge = value => {
  const sign = value < 0 ? '-' : '';
  const number = (Math.abs(value) / 100).toFixed(2);
  return `${sign}£${commaNumber(number)}`;
};

exports.charge = charge;
