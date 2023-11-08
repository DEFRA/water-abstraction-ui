'use strict'

const ServiceClient = require('../../../../../shared/lib/connectors/services/ServiceClient')

class BillRunsApiClient extends ServiceClient {
  /**
   * Creates a new bill run
   *
   * @param {Object} body An object containing the data items required to create an SROC bill run
   * @param {Object} cookie Existing cookie set by this app needed for pass-through authentication
   * @param {String} [previousBillRunId] The id of the previous bill run
   *
   * @return {Promise} resolves with the new bill run details
   */
  createBillRun (body, cookie, previousBillRunId = undefined) {
    body.previousBillRunId = previousBillRunId

    const url = this.joinUrl('bill-runs')
    const options = {
      headers: {
        cookie
      },
      body
    }
    return this.serviceRequest.post(url, options)
  }
}

module.exports = BillRunsApiClient
