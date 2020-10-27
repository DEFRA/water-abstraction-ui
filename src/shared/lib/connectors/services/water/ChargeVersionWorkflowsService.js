const ServiceClient = require('../ServiceClient');

class ChargeVersionWorkflowsService extends ServiceClient {
  /**
  * Fetches all licences without charge versions
  */
  getLicencesWithoutChargeInformation () {
    const url = this.joinUrl('licences', 'without-charge-versions');
    return this.serviceRequest.get(url);
  }
  /**
   * Fetches all charge version workflows in progress
   */
  getChargeVersionWorkflows () {
    const url = this.joinUrl('charge-version-workflows');
    return this.serviceRequest.get(url);
  }

  /*
   * Gets charge version workflows for given licence id
   * @param {String} licenceId
   */
  getChargeVersionWorkflow (workflowId) {
    const url = this.joinUrl('charge-version-workflows', workflowId);
    return this.serviceRequest.get(url);
  }

  /**
 * Gets charge version workflows for given licence id
 * @param {String} licenceId
 */
  getChargeVersionWorkflowsForLicence (licenceId) {
    const url = this.joinUrl('charge-version-workflows');
    return this.serviceRequest.get(url, {
      qs: { licenceId }
    });
  }

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
   * Send a PATCH request to the service relating to a charge version workflow
   */
  patchChargeVersionWorkflow (workflowId, status = 'review', approverComments = null, chargeVersion = {}) {
    const url = this.joinUrl('charge-version-workflows', workflowId);
    return this.serviceRequest.patch(url, {
      body: {
        status,
        approverComments,
        chargeVersion
      }
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

  deleteChargeVersionWorkflowByLicenceId (licenceId, status) {
    const url = this.joinUrl('licences/', licenceId, 'pending-charge-version-workflow', status);
    return this.serviceRequest.delete(url);
  }
}

module.exports = ChargeVersionWorkflowsService;
