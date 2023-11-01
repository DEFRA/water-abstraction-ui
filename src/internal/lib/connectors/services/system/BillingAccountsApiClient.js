'use strict'

const ServiceClient = require('../../../../../shared/lib/connectors/services/ServiceClient')

class BillingAccountsApiClient extends ServiceClient {
  changeAddress (invoiceAccountId, data, cookie) {
    const url = this.joinUrl(`billing-accounts/${invoiceAccountId}/change-address`)
    const options = {
      headers: {
        cookie
      },
      body: {
        ...data
      }
    }
    return this.serviceRequest.post(url, options)
  }
}

module.exports = BillingAccountsApiClient
