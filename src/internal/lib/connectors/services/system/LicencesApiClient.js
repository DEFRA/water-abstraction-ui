'use strict'

const ServiceClient = require('../../../../../shared/lib/connectors/services/ServiceClient')

class LicencesApiClient extends ServiceClient {
  /**
   * Flags a licence for the supplementary bill run
   *
   * @param {String} licenceId - The UUID of the licence that needs flagging
   * @param {Object} cookie - Existing cookie set by this app needed for pass-through authentication
   *
   * @returns {Promise} resolves with the licence being flagged for the supplementary bill run
   */
  supplementary (licenceId, cookie) {
    const url = this.joinUrl('licences/supplementary')
    const options = {
      headers: {
        cookie
      },
      body: {
        licenceId
      }
    }
    return this.serviceRequest.post(url, options)
  }
}

module.exports = LicencesApiClient
