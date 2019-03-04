/**
 * Abstraction over request-promise-native for making requests to
 * downstream services that are always JSON content type and
 * always pass a JWT auth header.
 */

const http = require('./http');
const { partial } = require('lodash');

const makeRequest = (method, url, additionalOptions = {}) => {
  const options = Object.assign({
    url,
    method,
    json: true,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  }, additionalOptions);
  return http.request(options);
};

exports.get = partial(makeRequest, 'GET');
exports.post = partial(makeRequest, 'POST');
exports.patch = partial(makeRequest, 'PATCH');
