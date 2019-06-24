const SharedLicencesAPIClient = require('shared/lib/connectors/services/water/licences');

const options = { includeExpired: true };

class LicencesAPIClient extends SharedLicencesAPIClient {
  getSummaryByDocumentId (documentId) {
    return super.getSummaryByDocumentId(documentId, options);
  }

  getCommunicationsByDocumentId (documentId) {
    return super.getCommunicationsByDocumentId(documentId, options);
  }

  getUsersByDocumentId (documentId) {
    return super.getUsersByDocumentId(documentId, options);
  }

  getPrimaryUserByDocumentId (documentId) {
    return super.getPrimaryUserByDocumentId(documentId, options);
  }
}

module.exports = LicencesAPIClient;
