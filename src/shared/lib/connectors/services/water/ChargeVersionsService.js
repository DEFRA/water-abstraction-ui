const ServiceClient = require('../ServiceClient');

class ChargeVersionsService extends ServiceClient {
  /**
   * Gets the charge versions for the given licence
   * @param {String} licenceRef The licence id
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
}

module.exports = ChargeVersionsService;
