const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http, serviceRequest } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, '/verification');
const getVerificationDocumentsEndpoint = (serviceUrl, verificationId) =>
  urlJoin(getEndpoint(serviceUrl), verificationId, 'documents');

class VerificationsApiClient extends APIClient {
  /**
   * Create a new instance of a VerificationsApiClient
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
   * Create a list of documents for a verification
   * @param {String} verificationId - GUID for the verification ID
   * @param {Array} documentIds - array of document Ids
   * @return {Promise}
   */
  addDocuments (verificationId, documentIds) {
    const uri = getVerificationDocumentsEndpoint(this.config.serviceUrl, verificationId);
    return serviceRequest.post(uri, {
      body: {
        document_id: documentIds
      }
    });
  };

  /**
   * Get a list of documents for a verification
   * @param {String} verificationId - GUID for the verification ID
   * @return {Promise}
   */
  getDocuments (verificationId, documentIds) {
    const uri = getVerificationDocumentsEndpoint(this.config.serviceUrl, verificationId);
    return serviceRequest.get(uri);
  };
}

module.exports = VerificationsApiClient;
