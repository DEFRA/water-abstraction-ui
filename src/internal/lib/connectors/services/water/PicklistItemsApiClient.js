const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, 'picklist-items');

class PicklistItems extends APIClient {
  /**
   * Create a new instance of a PicklistItems
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
   * Gets picklist items from water service
   * @param {String} picklistId - user defined picklist ID
   * @return {Promise} resolves with picklist items array
   */
  getPicklistItems (picklistId) {
    const filter = { picklist_id: picklistId };
    const sort = { value: +1 };
    return this.findAll(filter, sort);
  };
};

module.exports = PicklistItems;
