const SharedLicencesApiClient = require('shared/lib/connectors/services/water/licences');

class LicencesApiClient extends SharedLicencesApiClient {
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

module.exports = LicencesApiClient;
