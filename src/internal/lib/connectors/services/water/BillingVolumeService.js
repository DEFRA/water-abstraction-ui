const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingVolumeService extends ServiceClient {
  /**
   * Get billing volume by ID
   * @param {String} billingVolumeId
   */
  getBillingVolume (billingVolumeId) {
    const uri = this.joinUrl('billing/volumes', billingVolumeId);
    return this.serviceRequest.get(uri);
  }

  /**
   * Updates the billing volume for the supplied billing volume ID
   * @param {String} billingVolumeId
   * @param {Number} volume
   */
  updateVolume (billingVolumeId, volume) {
    const uri = this.joinUrl('billing/volumes/', billingVolumeId);
    return this.serviceRequest.patch(uri, {
      body: { volume }
    });
  }
}

module.exports = BillingVolumeService;
