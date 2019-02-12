const fileCheck = require('../../../lib/file-check');

/**
 * Checks if virus scanner is working correctly
 * @return {Promise} Resolves with boolean true if OK
 */
const getVirusScannerStatus = async () => {
  const clean = await fileCheck.virusCheck('./test/lib/test-files/test-file.txt');
  const infected = await fileCheck.virusCheck('./test/lib/test-files/eicar-test.txt');
  return clean && !infected;
};

module.exports = {
  getVirusScannerStatus
};
