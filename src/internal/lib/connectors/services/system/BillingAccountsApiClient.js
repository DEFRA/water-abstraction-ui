'use strict'

const ServiceClient = require('../../../../../shared/lib/connectors/services/ServiceClient')

class BillingAccountsApiClient extends ServiceClient {
  changeAddress (invoiceAccountId, data) {
    const url = this.joinUrl(`billing-accounts/${invoiceAccountId}/change-address`)
    const options = {
      body: {
        ...data
      }
    }
    return this.serviceRequest.post(url, options)
  }
}

module.exports = BillingAccountsApiClient
