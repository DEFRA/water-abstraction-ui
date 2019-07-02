const { APIClient, throwIfError } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, '/entity');

class EntitiesApiClient extends APIClient {
  /**
   * Create a new instance of a EntitiesApiClient
   * @param {Object} config Object containing the services.crm url and the jwt.token value
   * @param {Object} logger The system logger object
   */
  constructor (config, logger) {
    const serviceUrl = config.services.crm;

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
   * Gets or creates an individual CRM entity identified by the specified email
   * address
   * @param  {String}  emailAddress - the user's IDM email address
   * @return {Promise}              resolves with CRM entity object
   */
  async getOrCreateIndividual (emailAddress) {
    const filter = {
      entity_nm: emailAddress.toLowerCase().trim(),
      entity_type: 'individual'
    };

    // Get existing entity
    const { error, data } = await this.findMany(filter);
    throwIfError(error);

    if (data.length > 1) {
      throw new Error(`${data.length} records found looking for entity with name ${emailAddress}`);
    }

    if (data.length === 1) {
      return data[0];
    }

    // Create new entity
    const response = await this.create(filter);
    throwIfError(response.error);

    return response.data;
  };
}

module.exports = EntitiesApiClient;
