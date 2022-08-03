const numberFormatter = require('../../../lib/number-formatter')

/**
 * Formats a charge value
 * The sign is discarded as credits either appear in their own column or
 * with "Credit note"
 * @param {Number|String} value - charge value
 * @param {Boolean} [showSign] - if true, the sign is displayed
 * @param {Boolean} [isPence] - if true, the value is divided by 100
 * @return {String} formatted number with £ prefix
 */
const charge = (value, showSign = false, isPence = true) => {
  if (value === null || value === undefined) {
    return
  }
  return `${numberFormatter.formatCurrency(value, showSign, true, isPence)}`
}

exports.charge = charge
