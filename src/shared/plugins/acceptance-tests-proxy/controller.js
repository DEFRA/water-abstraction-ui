/**
 * Takes the path after "acceptance-tests" and forwards the
 * request to the water-service to faciliate acceptance testing.
 *
 * @param {Object} request HAPI request
 */
const proxyToWaterService = request => {
  const { postToPath } = request.route.realm.pluginOptions;
  return postToPath(request.params.tail);
};

exports.proxyToWaterService = proxyToWaterService;
