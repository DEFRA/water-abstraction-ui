const { APIClient, throwIfError } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http, serviceRequest } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, 'document_verifications');

class DocumentVerificationsApiClient extends APIClient {
  /**
   * Create a new instance of a DocumentVerificationsApiClient
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
  /**
   * Gets a list of verification codes and entity_nm values relating to documents
   * @param {String} document_id - the document header ID
   * @return {Promise} resolves with array of verification data
   */
  async getUniqueDocumentVerifications (documentId) {
    const { error, data: verifications } = await this.getDocumentVerifications(documentId);
    throwIfError(error);

    const withKey = verifications.map(v => {
      return { key: `${v.entity_id}.${v.document_id}`, ...v };
    });

    const sorted = withKey.sort((a, b) => {
      return new Date(b.date_created) - new Date(a.date_created);
    });

    const unique = sorted.reduce((acc, v) => acc.set(v.key, v), new Map());
    return Array.from(unique.values());
  }
}

module.exports = DocumentVerificationsApiClient;
