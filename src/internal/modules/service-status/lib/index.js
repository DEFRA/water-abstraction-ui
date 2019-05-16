const {
  getIDMUserCount,
  getIDMKPIData,
  getCRMDocumentCount,
  getCRMKPIData,
  getCRMVerificationCount,
  getPermitCount,
  getWaterPendingImports,
  getWaterCompletedImports
} = require('./connectors');

const { getVirusScannerStatus } = require('./virus-scanner');
const { logger } = require('../../../logger');

/**
 * Handles error calling remote API, logs and returns 'ERROR' as a string
 * @param  {Function}  func - the function to call
 * @return {Promise}   resolves with data from the call, or 'ERROR'
 */
const handleError = async (func) => {
  try {
    const data = await func();
    return data;
  } catch (err) {
    logger.error(err);
    return 'ERROR';
  }
};

/**
 * Gets status info from all services
 * @return {Promise} [Array] - resolves with an array of data collected from
 *                             the various services
 */
const getStatus = async () => {
  const tasks = [
    getIDMUserCount,
    getIDMKPIData,
    getCRMDocumentCount,
    getCRMKPIData,
    getCRMVerificationCount,
    getPermitCount,
    getWaterPendingImports,
    getWaterCompletedImports,
    getVirusScannerStatus
  ];

  const mapped = tasks.map(handleError);

  return Promise.all(mapped);
};

module.exports = {
  getStatus
};
