const Boom = require('boom');
const { returns } = require('../../../lib/connectors/water');
const { applyUserDetails, applyStatus } = require('../lib/return-helpers');

/**
 * Gets the key to use for storing return data in user session
 * @param {Object} request
 * @return {String}
 */
const getSessionKey = (request) => {
  const isInternal = request.permissions.hasPermission('admin.defra');
  return `${isInternal ? 'internal' : 'external'}ReturnFlow`;
};

/**
 * Loads return data from session.
 * If not found a Boom error is thrown
 * @param {Object} request - HAPI request interface
 * @return {Object} - return data model
 */
const getSessionData = (request) => {
  const sessionKey = getSessionKey(request);

  const data = request.sessionStore.get(sessionKey);

  if (!data) {
    throw Boom.badImplementation(`Return not found in session`);
  }
  return data;
};

/**
 * Save return data back to session
 * @param {Object} request - HAPI request interface
 * @param {Object} data - current state of return flow
 */
const saveSessionData = (request, data) => {
  const sessionKey = getSessionKey(request);
  request.sessionStore.set(sessionKey, data);
};

/**
 * Delete return data in session
 * @param {Object} request - HAPI request interface
 */
const deleteSessionData = (request) => {
  const sessionKey = getSessionKey(request);
  request.sessionStore.delete(sessionKey);
};

/**
 * Saves return data stored in session back to water service
 * (which in turn updates returns service/NALD tables)
 * @param {Object} data
 * @param {Object} request - HAPI request interface
 * @return {Promise} resolve when data posted to water service
 */
const submitReturnData = (data, request) => {
  const d = applyStatus(applyUserDetails(data, request.auth.credentials));

  // Don't bother sending required return lines/versions
  delete d.requiredLines;
  delete d.versions;

  // Post return
  try {
    request.log('info', `Posting return`);
    request.log('info', JSON.stringify(d, null, 2));
    return returns.postReturn(d);
  } catch (err) {
    request.log('error', err);
    throw err;
  }
};

module.exports = {
  getSessionKey,
  getSessionData,
  saveSessionData,
  deleteSessionData,
  submitReturnData
};
