/**
 * Splits string by separator, and returns the element with the supplied index
 * @param {String} value - the string to split
 * @param {Number} [index] - the index of the element to return (0 indexed)
 * @param {String} [separator] - the string to split on (default is ,)
 * @return {String}
 */
const splitString = (value, index = 0, separator = ',') => {
  const segments = (value || '').split(separator);
  return segments[index];
};

<<<<<<< HEAD
exports.splitString = splitString;
=======
/**
 * Takes in a string of comma and/or line separated values, and creates
 * a unique array of trimmed items separated by commas
 * @param  {string} str The input string
 * @return {string}     A comma separated string of the unique values
 */
const commaOrLineSeparatedValuesToCsv = str => {
  return (str || '')
    .split(/[ \n\r,\t;]+/ig)
    .filter(s => s)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(',');
};

module.exports = {
  splitString,
  commaOrLineSeparatedValuesToCsv
};
>>>>>>> WATER-2087
