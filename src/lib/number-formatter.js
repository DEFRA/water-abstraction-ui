
/**
 * Reduces the supplied number to fixed precision, given the number
 * of decimal places.
 * However, if the decimal places are not necessary, they are removed
 * @param {Number} number
 * @param {Number} decimalPlaces
 * @return {Number}
 */
const maxPrecision = (number, decimalPlaces) => {
  console.log(`maxPrecision ${number} ${decimalPlaces}`);
  for (let i = 0; i < decimalPlaces; i++) {
    if (parseFloat(number.toFixed(decimalPlaces)) === parseFloat(number.toFixed(i))) {
      return number.toFixed(i);
    }
  }
  return number.toFixed(decimalPlaces);
};

module.exports = {
  maxPrecision
};
