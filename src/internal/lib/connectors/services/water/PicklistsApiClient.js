const { APIClient } = require('@envage/hapi-pg-rest-api');
const Boom = require('@hapi/boom');
const urlJoin = require('url-join');
const { http } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, 'picklists');

class PicklistsApiClient extends APIClient {
  /**
   * Create a new instance of a PicklistsApiClient
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

  async getPicklist (picklistId) {
    const { data, error } = await this.findOne(picklistId);

    if (error) {
      throw Boom.badImplementation(`Error get picklist ${picklistId}`, error);
    }

    return data;
  }
};

module.exports = PicklistsApiClient;
