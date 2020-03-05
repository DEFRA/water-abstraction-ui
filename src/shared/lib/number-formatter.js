const commaNumber = require('comma-number');

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
    return number;
  }

  for (let i = 0; i < decimalPlaces; i++) {
    if (parseFloat(number.toFixed(decimalPlaces)) === parseFloat(number.toFixed(i))) {
      return number.toFixed(i);
    }
  }
  return number.toFixed(decimalPlaces);
};

/**
 * Moves the decimal 2 spaces left for a number and
 * adds an optional currency symbol
 * @param {Number} number
 * @param {Boolean} isSigned
 * @param {CharacterData} currencySymbol
 * @return {String}
 */
const penceToPound = (number, isSigned = false, showCurrency = false) => {
  if (typeof (number) !== 'number') {
    return number;
  }
  const sign = (parseFloat(number)) < 0 && isSigned ? '-' : '';
  const value = (Math.abs(number) / 100).toFixed(2);
  const currencySymbol = showCurrency ? '£' : '';
  return `${sign}${currencySymbol}${commaNumber(value)}`;
};

exports.penceToPound = penceToPound;
exports.maxPrecision = maxPrecision;
