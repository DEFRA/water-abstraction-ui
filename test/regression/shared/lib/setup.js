'use strict';

/**
 * Contains methods to set up/tear down acceptance test data in water service
 */
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

/**
 * Calls the water service
 * @param {String} uri
 * @param {Object} [overrides]
 * @return {Promise}
 */
const callWaterService = async (uri, overrides = {}) => {
  const opts = Object.assign({}, {
    uri,
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
const setUp = () => callWaterService(`${process.env.WATER_URI}/acceptance-tests/set-up`, {
  form: {
    includeInternalUsers: true
  }
});

/**
 * Tears down acceptance test data
 * @return {Promise}
 */
const tearDown = () => callWaterService(`${process.env.WATER_URI}/acceptance-tests/tear-down`);

exports.setUp = setUp;
exports.tearDown = tearDown;
