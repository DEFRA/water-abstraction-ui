'use strict';

/**
 * Contains methods to set up/tear down acceptance test data in water service
 */
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const urlJoin = require('url-join');

/**
 * HTTP request to the water service
 * @param {String} uri
 * @param {Object} [overrides]
 * @return {Promise}
 */
const waterRequest = async (tail, overrides = {}) => {
  const opts = Object.assign({}, {
    uri: urlJoin(process.env.WATER_URI, tail),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.JWT_TOKEN}`
    }
  }, overrides);
  console.log(`Calling ${opts.method} ${opts.uri}`);
  await rp(opts);
  console.log(`Calling ${opts.method} ${opts.uri} - success!`);
};

/**
 * Sets up acceptance test data
 * @return {Promise}
 */
const setUp = () => waterRequest('/acceptance-tests/set-up', {
  form: {
    includeInternalUsers: true
  }
});

/**
 * Tears down acceptance test data
 * @return {Promise}
 */
const tearDown = () => waterRequest('/acceptance-tests/tear-down');

exports.setUp = setUp;
exports.tearDown = tearDown;
