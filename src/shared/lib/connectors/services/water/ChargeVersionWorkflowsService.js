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
  getChargeVersionWorkflows (page = 1, perPage = 25, tabFilter = 'review') {
    // options: to_setup, review, changes_requested
    const url = this.joinUrl('charge-version-workflows');
    return this.serviceRequest.get(url, {
      qs: {
        page,
        perPage,
        tabFilter
      }
    });
  }

  /*
   * Gets charge version workflows for given licence id
   * @param {String} licenceId
   */
  getChargeVersionWorkflow (chargeVersionWorkflowId) {
    const url = this.joinUrl('charge-version-workflows', chargeVersionWorkflowId);
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
  patchChargeVersionWorkflow (chargeVersionWorkflowId, patchObject = {
    status: 'review',
    approverComments: null,
    chargeVersion: {}
  }) {
    const { status, approverComments, chargeVersion, createdBy } = patchObject;
    const url = this.joinUrl('charge-version-workflows', chargeVersionWorkflowId);
    const body = {
      status,
      approverComments,
      chargeVersion
    };

    if (createdBy) {
      body.createdBy = createdBy;
    }
    return this.serviceRequest.patch(url, { body });
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
