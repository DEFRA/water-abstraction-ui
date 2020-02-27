const { isNil } = require('lodash');
const commaNumber = require('comma-number');

/**
 * Formats an integer charge value in pence
 * The sign is discarded as credits either appear in their own column or
 * with "Credit note"
 * @param {Number} value - charge as an integer in pence
 * @param {Boolean} [isSigned] - if true, the sign is displayed
 * @return {String} formatted number with £ prefix
 */
const charge = (value, isSigned = false) => {
  if (isNil(value)) {
    return;
  }
  const sign = (parseFloat(value)) < 0 && isSigned ? '-' : '';
  const number = (Math.abs(value) / 100).toFixed(2);
  return `${sign}£${commaNumber(number)}`;
};

exports.charge = charge;
