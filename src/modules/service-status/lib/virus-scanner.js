const { virusCheck } = require('../../../lib/file-check');

const cleanFile = async () => {
  try {
    const result = await virusCheck('./test/lib/test-files/test-file.txt');
    return result === true;
  } catch (err) {
    return false;
  }
};

const infectedFile = async () => {
  try {
    await virusCheck('./test/lib/test-files/eicar-test.txt');
    return false;
  } catch (err) {
    console.log(err);
    return true;
  }
};

const getVirusScannerStatus = async () => {
  const passClean = await cleanFile();
  const passInfected = await infectedFile();

  const isOK = passClean && passInfected;

  return isOK ? 'OK' : 'ERROR';
};

module.exports = {
  getVirusScannerStatus
};
