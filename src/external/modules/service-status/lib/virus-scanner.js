const fileCheck = require('../../../../shared/lib/file-check');

/**
 * Checks if virus scanner is working correctly
 * @return {Promise} Resolves with boolean true if OK
 */
const getVirusScannerStatus = async () => {
  const clean = await fileCheck.virusCheck('./test/shared/lib/test-files/test-file.txt');
  const infected = await fileCheck.virusCheck('./test/shared/lib/test-files/eicar-test.txt');
  return clean.isClean && !infected.isClean;
};

exports.getVirusScannerStatus = getVirusScannerStatus;
