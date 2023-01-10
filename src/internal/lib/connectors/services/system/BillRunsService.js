'use strict'

const ServiceClient = require('../../../../../shared/lib/connectors/services/ServiceClient')

class SystemService extends ServiceClient {
  /**
   * Creates a new bill run
   *
   * @param {String} type The type of bill run to create (ie. supplementary etc.)
   * @param {String} scheme The scheme to create the bill run for (ie. sroc etc.)
   * @param {String} region The GUID of the region to create the bill run for
   * @param {String} user The email address of the user requesting bill run creation
   * @param {String} [previousBillRunId] The id of the previous bill run
   *
   * @return {Promise} resolves with the new bill run details
   */
  createBillRun (type, scheme, region, user, previousBillRunId = undefined) {
    const url = this.joinUrl('bill-runs')
    const options = {
      body: {
        type,
        scheme,
        region,
        user,
        previousBillRunId
      }
    }
    return this.serviceRequest.post(url, options)
  }
}

module.exports = SystemService
