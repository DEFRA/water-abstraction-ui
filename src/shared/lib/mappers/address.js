'use strict';

const { pick, identity } = require('lodash');

/**
 * Maps address object to array
 * @param {Object} address
 * @return {Array} address as an array, with all empty parts removed
 */
const mapAddressToArray = address => {
  const parts = pick(address, [
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'addressLine4',
    'town',
    'county',
    'postcode',
    'country'
  ]);
  return Object.values(parts)
    .filter(identity);
};

/**
 * Maps address object to string
 * @param {Object} address
 * @return {String} address as a string, with all empty parts removed
 */
const mapAddressToString = address =>
  mapAddressToArray(address).join(', ');

exports.mapAddressToArray = mapAddressToArray;
exports.mapAddressToString = mapAddressToString;
