/**
 * Abstraction over request-promise-native for making requests to
 * downstream services that are always JSON content type and
 * always pass a JWT auth header.
 */

const http = require('./http');

const makeRequest = (method, url, additionalOptions = {}) => {
  const options = Object.assign({
    url,
    method: method,
    json: true,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  }, additionalOptions);
  return http.request(options);
};

module.exports = {
  get: (url, additionalOptions = {}) => {
    makeRequest('GET', url, additionalOptions);
  },

  post: (url, additionalOptions = {}) => {
    makeRequest('POST', url, additionalOptions);
  },

  patch: (url, additionalOptions = {}) => {
    makeRequest('PATCH', url, additionalOptions);
  }
};
