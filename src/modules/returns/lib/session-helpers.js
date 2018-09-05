const Boom = require('boom');
const { returns } = require('../../../lib/connectors/water');
const { applyUserDetails } = require('../lib/return-helpers');

/**
 * Loads return data from session.
 * If not found a Boom error is thrown
 * @param {Object} request - HAPI request interface
 * @return {Object} - return data model
 */
const fetchReturnData = (request) => {
  const data = request.sessionStore.get('internalReturnFlow');

  if (!data) {
    throw Boom.badImplementation(`Return not found in session`);
  }
  return data;
};

/**
 * Saves return data stored in session back to water service
 * (which in turn updates returns service/NALD tables)
 * @param {Object} data
 * @param {Object} request - HAPI request interface
 * @return {Promise} resolve when data posted to water service
 */
const persistReturnData = (data, request) => {
  const d = applyUserDetails(data, request.auth.credentials);

  // Post return
  try {
    console.log(`Posting return`);
    console.log(d, null, 2);
    return returns.postReturn(d);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = {
  fetchReturnData,
  persistReturnData
};
