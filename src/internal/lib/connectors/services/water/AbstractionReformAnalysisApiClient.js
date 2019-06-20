const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http, serviceRequest } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, '/ar/licences');

class AbstractionReformAnalysisApiClient extends APIClient {
  /**
   * Create a new instance of a AbstractionReformAnalysisApiClient
   * @param {Object} config Object containing the services.water url and the jwt.token value
   * @param {Object} logger The system logger object
   */
  constructor (config, logger) {
    const serviceUrl = config.services.water;

    super(http.request, {
      serviceUrl,
      endpoint: getEndpoint(serviceUrl),
      logger,
      headers: {
        Authorization: config.jwt.token
      }
    });
  }

  /**
   * This webhook in the water service causes the status of the abstraction reform
   * licence to be refreshed in the analysis table.
   * It should be called whenever an AR licence is mutated
   * @param  {String} licenceRef - licence number
   * @return {Promise}            resolves when licence has been refreshed
   */
  arRefreshLicenceWebhook (licenceRef) {
    const uri = urlJoin(this.config.serviceUrl, 'ar', licenceRef);
    return serviceRequest.post(uri);
  }
};

module.exports = AbstractionReformAnalysisApiClient;
