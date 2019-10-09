'use strict';

/**
 * A handlebars helper to add two numbers
 */
const precision = (value, dp) => Number(value).toFixed(dp);

module.exports = precision;
