const qs = require('querystring');

/**
 * Serializes the supplied object into an HTTP query string
 * @param {Object} - parameters to serialise
 * @return {String} query string
 */
const queryString = (obj = {}) => {
  return qs.stringify(obj);
};

module.exports = {
  queryString
};
