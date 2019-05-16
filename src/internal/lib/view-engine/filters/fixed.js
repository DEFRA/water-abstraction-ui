/**
 * Formats a number to fixed precision
 * @param  {Mixed} value     - number or string
 * @param  {Numnber} precision - number of DP
 * @return {String}
 */
const fixed = (value, precision) => {
  return parseFloat(value).toFixed(precision);
};

module.exports = {
  fixed
};
