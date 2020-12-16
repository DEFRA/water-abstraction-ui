'use strict';

const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const config = require('../config');

/**
 * Removes data created by test suite
 * @return {Promise}
 */
const tearDown = () =>
  rp.post(`${config.baseUrl}/acceptance-tests/tear-down`);

exports.tearDown = tearDown;
