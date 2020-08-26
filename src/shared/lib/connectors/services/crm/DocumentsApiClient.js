const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http } = require('@envage/water-abstraction-helpers');
const Boom = require('@hapi/boom');

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

  /**
   * Given an array of licence numbers, gets a map so they
   * can be found in the CRM document headers
   * @param {Array<String>} licenceNumbers
   * @return {Promise<Map>} a map of document IDs keyed by licence number
   */
  async getDocumentIdMap (licenceNumbers = []) {
    const { data } = await this.findMany(
      {
        system_external_id: { $in: licenceNumbers }
      },
      null,
      { page: 1, perPage: Number.MAX_SAFE_INTEGER },
      ['document_id', 'system_external_id']
    );
    return new Map(
      data.map(doc => [doc.system_external_id, doc.document_id])
    );
  }
}

module.exports = DocumentsApiClient;
