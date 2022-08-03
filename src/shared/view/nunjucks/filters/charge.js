const numberFormatter = require('../../../lib/number-formatter')
const { isNil } = require('lodash')
/**
 * Formats an integer charge value in pence
 * The sign is discarded as credits either appear in their own column or
 * with "Credit note"
 * @param {Number} value - charge as an integer in pence
 * @param {Boolean} [isSigned] - if true, the sign is displayed
 * @param {Boolean} [isPence] - if true, the value is divided by 100
 * @return {String} formatted number with £ prefix
 */
const charge = (value, isSigned = false, isPence = true) => {
  if (isNil(value)) {
    return
  }
  return `${numberFormatter.formatCurrency(value, isSigned, true, isPence)}`
}

exports.charge = charge
