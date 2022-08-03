'use strict'

const commaNumber = require('comma-number')

/**
 * Reduces the supplied number to fixed precision, given the number
 * of decimal places.
 * However, if the decimal places are not necessary, they are removed
 * @param {Number} number
 * @param {Number} decimalPlaces
 * @return {Number}
 */
const maxPrecision = (number, decimalPlaces) => {
  if (typeof (number) !== 'number') {
    return number
  }

  for (let i = 0; i < decimalPlaces; i++) {
    if (parseFloat(number.toFixed(decimalPlaces)) === parseFloat(number.toFixed(i))) {
      return number.toFixed(i)
    }
  }
  return number.toFixed(decimalPlaces)
}

/**
 * Optionally moves the decimal 2 spaces left for a number and
 * adds an optional currency symbol
 * @param {Number|String} number
 * @param {Boolean} [showSign]
 * @param {Boolean} [showCurrency]
 * @param {Boolean} [penceToPounds]
 * @return {String}
 */
const formatCurrency = (number, showSign = false, showCurrency = false, penceToPounds = true) => {
  const parsedNumber = parseFloat(number)

  if (isNaN(parsedNumber)) {
    return number
  }

  const sign = showSign && parsedNumber < 0 ? '-' : ''
  const value = penceToPounds ? (Math.abs(number) / 100) : number
  const currencySymbol = showCurrency ? '£' : ''
  return `${sign}${currencySymbol}${commaNumber(value.toFixed(2))}`
}

exports.formatCurrency = formatCurrency
exports.maxPrecision = maxPrecision
