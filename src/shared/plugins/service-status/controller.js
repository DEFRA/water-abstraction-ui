'use strict';

const Catbox = require('@hapi/catbox');
const CatboxRedis = require('@hapi/catbox-redis');

const getRedisCacheStatus = async (redisConfig, logger) => {
  let result = 'Not connected';

  try {
    const options = {
      host: redisConfig.host,
      port: redisConfig.port,
      ...(redisConfig.password && { password: redisConfig.password }),
      db: 0
    };

    const cache = new Catbox.Client(CatboxRedis, options);
    await cache.start();

    const key = { segment: 'serviceStatus', id: 'testStatus' };
    await cache.set(key, true, 10000);
    const value = await cache.get(key);

    if (value) {
      result = 'Connected';
    }
  } catch (err) {
    logger.error('Cache not connected', err);
  }

  return result;
};

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
  const { services, redis, logger } = h.realm.pluginOptions;

  const [status, virusScanner, cacheConnection] = await Promise.all([
    services.water.serviceStatus.getServiceStatus(),
    getVirusScannerStatus(),
    getRedisCacheStatus(redis, logger)
  ]);

  const serviceStatus = Object.assign({}, status.data, { virusScanner }, { cacheConnection });

  return request.query.format === 'json'
    ? serviceStatus
    : h.view('nunjucks/service-status/index', {
      ...request.view,
      ...serviceStatus
    });
};

exports.getServiceStatus = getServiceStatus;
