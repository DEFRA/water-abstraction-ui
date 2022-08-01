const { camelCase, lowerCase, snakeCase, startCase, upperFirst } = require('lodash')

/**
 * Splits string by separator, and returns the element with the supplied index
 * @param {String} value - the string to split
 * @param {Number} [index] - the index of the element to return (0 indexed)
 * @param {String} [separator] - the string to split on (default is ,)
 * @return {String}
 */
const splitString = (value, index = 0, separator = ',') => {
  const segments = (value || '').split(separator)
  return segments[index]
}

exports.splitString = splitString

exports.titleCase = str => startCase(camelCase(str))
exports.snakeCase = snakeCase
exports.sentenceCase = str => upperFirst(lowerCase(str))
