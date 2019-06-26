const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, '/returns');

class ReturnsApiClient extends APIClient {
  /**
   * Create a new instance of a ReturnsApiClient
  * @param {Object} config Object containing the services.returns url and the jwt.token value
   * @param {Object} logger The system logger object
   */
  constructor (config, logger) {
    const serviceUrl = config.services.returns;

    super(http.request, {
      serviceUrl,
      endpoint: getEndpoint(serviceUrl),
      logger,
      headers: {
        Authorization: config.jwt.token
      }
    });
  }
}

module.exports = ReturnsApiClient;
