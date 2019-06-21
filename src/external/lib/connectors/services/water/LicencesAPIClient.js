const SharedLicencesAPIClient = require('shared/lib/connectors/services/water/licences');

class LicencesAPIClient extends SharedLicencesAPIClient {
  getSummaryByDocumentId (documentId, companyId) {
    return super.getSummaryByDocumentId(documentId, { companyId });
  }

  getCommunicationsByDocumentId (documentId, companyId) {
    return super.getCommunicationsByDocumentId(documentId, { companyId });
  }

  getUsersByDocumentId (documentId, companyId) {
    return super.getUsersByDocumentId(documentId, { companyId });
  }

  getPrimaryUserByDocumentId (documentId, companyId) {
    return super.getPrimaryUserByDocumentId(documentId, { companyId });
  }
}

module.exports = LicencesAPIClient;
