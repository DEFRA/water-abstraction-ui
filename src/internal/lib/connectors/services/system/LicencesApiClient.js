'use strict'

const ServiceClient = require('../../../../../shared/lib/connectors/services/ServiceClient')

class LicencesApiClient extends ServiceClient {
  /**
   * Flags a licence for the supplementary bill run
   *
   * @param {String} returnId - The UUID of the return log that needs flagging
   * @param {Object} cookie - Existing cookie set by this app needed for pass-through authentication
   *
   * @returns {Promise} resolves with the licence being flagged for the supplementary bill run
   */
  supplementary (returnId, cookie) {
    const url = this.joinUrl('licences/supplementary')
    const options = {
      headers: {
        cookie
      },
      body: {
        returnId
      }
    }
    return this.serviceRequest.post(url, options)
  }
}

module.exports = LicencesApiClient
