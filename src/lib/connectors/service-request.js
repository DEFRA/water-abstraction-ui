/**
 * Abstraction over request-promise-native for making requests to
 * downstream services that are always JSON content type and
 * always pass a JWT auth header.
 */
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const getOptions = (method, url, additionalOptions) => {
  return Object.assign({
    url,
    method: method,
    json: true,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  }, additionalOptions);
};

module.exports = {
  get: (url, additionalOptions = {}) => {
    const options = getOptions('GET', url, additionalOptions);
    return rp(options);
  },

  post: (url, additionalOptions = {}) => {
    const options = getOptions('POST', url, additionalOptions);
    return rp(options);
  },

  patch: (url, additionalOptions = {}) => {
    const options = getOptions('PATCH', url, additionalOptions);
    return rp(options);
  }
};
