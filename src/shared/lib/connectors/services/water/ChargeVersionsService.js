const ServiceClient = require('../ServiceClient');

class ChargeVersionsService extends ServiceClient {
  /**
   * Gets the charge versions for the given licence
   * @param {String} licenceId The licence id
   * @return {Promise} resolves with the charge versions data
   */
  getChargeVersionsByLicenceId (licenceId) {
    const url = this.joinUrl('charge-versions/licence', licenceId);
    return this.serviceRequest.get(url);
  };

  /**
   * Gets the charge versions for the given licence as represented
   * by a CRM document id
   * @param {String} documentId The CRM document id
   * @return {Promise} resolves with the charge versions data
   */
  getChargeVersionsByDocumentId (documentId) {
    const url = this.joinUrl('charge-versions/document', documentId);
    return this.serviceRequest.get(url);
  };

  /**
   * Gets full information for a given charge version id
   * @param {String} chargeVersionId The charge version id
   */
  getChargeVersion (chargeVersionId) {
    const url = this.joinUrl('charge-versions', chargeVersionId);
    return this.serviceRequest.get(url);
  }

  getDefaultChargesForLicenceVersion (licenceVersionId) {
    const url = this.joinUrl('charge-versions/default', licenceVersionId);
    return this.serviceRequest.get(url);
  }

  postCreateFromWorkflow (chargeVersionWorkflowId) {
    const url = this.joinUrl('charge-versions/create-from-workflow', chargeVersionWorkflowId);
    return this.serviceRequest.post(url);
  }

  postUpload (fileData, userName, filename, type = 'csv') {
    const url = this.joinUrl('charge-versions/upload', type.toLowerCase());
    return this.serviceRequest.post(url, { body: { fileData, userName, filename } });
  }

  getUploadErrors (eventId) {
    const url = this.joinUrl('charge-versions/download/', eventId);
    return this.serviceRequest.get(url);
  }
}

module.exports = ChargeVersionsService;
