const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http, serviceRequest } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, 'document_verifications');

class DocumentVerificationApiClient extends APIClient {
  /**
   * Create a new instance of a DocumentVerificationApiClient
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

  getDocumentVerifications (documentId) {
    const url = this.config.endpoint;

    const qs = {
      filter: JSON.stringify({
        document_id: documentId,
        'verification.date_verified': null
      })
    };

    return serviceRequest.get(url, { qs });
  }
}

module.exports = DocumentVerificationApiClient;
