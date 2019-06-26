const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, '/licences');

class LicencesApiClient extends APIClient {
  /**
   * Create a new instance of a LicencesApiClient
  * @param {Object} config Object containing the services.permits url and the jwt.token value
   * @param {Object} logger The system logger object
   */
  constructor (config, logger) {
    const serviceUrl = config.services.permits;

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

module.exports = LicencesApiClient;
