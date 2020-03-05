const numberFormatter = require('../../../lib/number-formatter');
const { isNil } = require('lodash');
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
  return `${numberFormatter.penceToPound(value, isSigned, '£')}`;
};

exports.charge = charge;
