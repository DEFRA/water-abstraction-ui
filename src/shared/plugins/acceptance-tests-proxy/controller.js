const Boom = require('boom');

/**
 * Takes the path after "acceptance-tests" and forwards the
 * request to the water-service to faciliate acceptance testing.
 *
 * @param {Object} request HAPI request
 */
const proxyToWaterService = request => {
  if (process.env.NODE_ENV === 'production') {
    throw Boom.notFound('Resource not available in production');
  }

  const { postToPath } = request.route.realm.pluginOptions;
  return postToPath(request.params.tail);
};

exports.proxyToWaterService = proxyToWaterService;
