'use strict';

const { pickBy, isUndefined } = require('lodash');

const isEmptyString = val => val === '';

const isValid = val => !isUndefined(val) && !isEmptyString(val);

/**
 * Prunes undefined values and empty strings from object
 *
 * @param {Object} obj
 * @returns {Object}
 */
const cleanObject = obj => pickBy(obj, isValid);

module.exports = cleanObject;
