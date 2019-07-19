const fileCheck = require('../../lib/file-check');

/**
 * Checks if virus scanner is working correctly
 * @return {Promise} Resolves with boolean true if OK
 */
const getVirusScannerStatus = async () => {
  try {
    const clean = await fileCheck.virusCheck('./test/shared/lib/test-files/test-file.txt');
    const infected = await fileCheck.virusCheck('./test/shared/lib/test-files/eicar-test.txt');
    const result = clean.isClean && !infected.isClean;
    return result ? 'OK' : 'ERROR';
  } catch (err) {
    return 'ERROR';
  }
};

const getServiceStatus = async (request, h) => {
  const { services } = h.realm.pluginOptions;
  const [status, virusScanner] = await Promise.all([
    services.water.serviceStatus.getServiceStatus(),
    getVirusScannerStatus()
  ]);

  const serviceStatus = Object.assign({}, status.data, { virusScanner });

  return request.query.format === 'json'
    ? serviceStatus
    : h.view(
      'nunjucks/service-status/index.njk',
      { ...request.view, ...serviceStatus },
      { layout: false }
    );
};

exports.getServiceStatus = getServiceStatus;
