const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, 'entity/{entityId}/roles');

class EntityRolesApiClient extends APIClient {
  /**
   * Create a new instance of a EntityRolesApiClient
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

  getEntityRoles (entityId) {
    return this.setParams({ entityId }).findAll();
  }
};

module.exports = EntityRolesApiClient;
