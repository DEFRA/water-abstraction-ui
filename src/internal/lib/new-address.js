const sessionHelpers = require('shared/lib/session-helpers');
const SESSION_KEY = 'newAddressData';

/**
 * Gets the address data from the session and clears it
 * @param {Object} request - hapi request
 * @return {Object} address
 */
const getNewAddress = request => {
  const address = request.yar.get(SESSION_KEY);
  request.yar.clear(SESSION_KEY);
  return address;
};

/**
 * Sets the address data in the session
 * @param {Object} request - hapi request
 * @return {Object} address
 */
const setNewAddress = (request, address) =>
  sessionHelpers.saveToSession(request, SESSION_KEY, address);

exports.get = getNewAddress;
exports.set = setNewAddress;
