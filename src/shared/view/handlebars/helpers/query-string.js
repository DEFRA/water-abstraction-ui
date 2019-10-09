'use strict';

const qs = require('querystring');

/**
 * A handlebars helper to get a query string for sorting data
 */
const queryString = function (context, options) {
  return qs.stringify(arguments[0].hash, '&amp;');
};

module.exports = queryString;
