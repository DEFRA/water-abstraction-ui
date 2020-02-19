const { isNull, isUndefined } = require('lodash');
const commaNumber = require('comma-number');

/**
 * Formats an integer charge value in pence
 * The sign is discarded as credits either appear in their own column or
 * with "Credit note"
 * @param {Number} value - charge as an integer in pence
 * @return {String} formatted number with £ prefix
 */
const charge = value => {
  if (isNull(value) || isUndefined(value)) {
    return;
  }
  const number = (Math.abs(value) / 100).toFixed(2);
  return `£${commaNumber(number)}`;
};

exports.charge = charge;
