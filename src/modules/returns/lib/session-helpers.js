const Boom = require('boom');
const { returns } = require('../../../lib/connectors/water');
const { applyUserDetails, applyCleanup } = require('../lib/return-helpers');
const logger = require('../../../lib/logger');
const { isInternal } = require('../../../lib/permissions');

/**
 * Gets the key to use for storing return data in user session
 * @param {Object} request
 * @return {String}
 */
const getSessionKey = (request) => {
  const { returnId } = request.query;
  const isInternalUser = isInternal(request);
  return `${isInternalUser ? 'internal' : 'external'}ReturnFlow:${returnId}`;
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
  const dataWithUser = applyUserDetails(data, request.auth.credentials);
  const dataToSubmit = applyCleanup(dataWithUser, request);

  // Post return
  try {
    request.log(`Posting return`, { data: dataToSubmit });
    return returns.postReturn(dataToSubmit);
  } catch (err) {
    logger.error('Submit return data error', { data: dataToSubmit });
    throw err;
  }
};

exports.getSessionKey = getSessionKey;
exports.getSessionData = getSessionData;
exports.saveSessionData = saveSessionData;
exports.deleteSessionData = deleteSessionData;
exports.submitReturnData = submitReturnData;
