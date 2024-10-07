'use strict'

const ServiceClient = require('../../../../../shared/lib/connectors/services/ServiceClient')

class WorkflowApiClient extends ServiceClient {
  /**
   * Flags a licence for the supplementary bill run
   *
   * @param {String} chargeVersionWorkflowId - The UUID of the workflow record being removed that needs flagging
   * @param {Object} cookie - Existing cookie set by this app needed for pass-through authentication
   *
   * @returns {Promise} resolves with the licence being flagged for the supplementary bill run
   */
  supplementary (chargeVersionWorkflowId, cookie) {
    const url = this.joinUrl('licences/supplementary')
    const options = {
      headers: {
        cookie
      },
      body: {
        chargeVersionWorkflowId
      }
    }
    return this.serviceRequest.post(url, options)
  }
}

module.exports = WorkflowApiClient
