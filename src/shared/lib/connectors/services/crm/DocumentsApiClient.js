const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http } = require('@envage/water-abstraction-helpers');
const Boom = require('boom');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, 'documentHeader');

class DocumentsApiClient extends APIClient {
  /**
   * Create a new instance of a DocumentsApiClient
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
      },
      waterRegimeEntityId: config.crm.regimes.water.entityId
    });
  }

  /**
   * Set licence name
   * @param {String} documentId - the CRM document ID identifying the permit
   * @param {String} name - the user-defined document name
   * @return {Promise} resolves when name updated
   */
  setLicenceName (documentId, name) {
    return this.updateOne(documentId, {
      document_name: name
    });
  };

  /**
   * Finds a single water abstraction licence in CRM
   * by licence number
   * @param {String} licenceRef - the licence number
   * @return {Promise} resolves with document header
   */
  async getWaterLicence (licenceRef, includeExpired = false) {
    if (!licenceRef) {
      throw Boom.badImplementation('Licence number is required');
    }

    const filter = {
      regime_entity_id: this.config.waterRegimeEntityId,
      system_external_id: licenceRef,
      includeExpired
    };
    const { error, data: [document] } = await this.findMany(filter);
    if (error) {
      throw Boom.badImplementation(error);
    }
    if (!document) {
      throw Boom.notFound(`Water licence number ${licenceRef} not found in CRM`);
    }
    return document;
  };
}

module.exports = DocumentsApiClient;
