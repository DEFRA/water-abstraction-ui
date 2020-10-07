const ServiceClient = require('../ServiceClient');

class ChargeVersionWorkflowsService extends ServiceClient {
  /**
   * Posts draft charge info to water service to store
   * @param {Object} draftChargeInformation
   */
  postChargeVersionWorkflow (draftChargeInformation) {
    const url = this.joinUrl('charge-version-workflows');
    return this.serviceRequest.post(url, {
      body: draftChargeInformation
    });
  }

  /**
   * Call to delete the charge version work flow for id provided
   * @param {String} chargeVersionWorkflowId guid
   */
  deleteChargeVersionWorkflow (chargeVersionWorkflowId) {
    const url = this.joinUrl('charge-version-workflows', chargeVersionWorkflowId);
    return this.serviceRequest.delete(url);
  }
}

module.exports = ChargeVersionWorkflowsService;
