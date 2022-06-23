const ServiceClient = require('shared/lib/connectors/services/ServiceClient')

class BillingInvoiceService extends ServiceClient {
  patchFlagForRebilling (invoiceId, isFlaggedForRebilling = true) {
    const uri = this.joinUrl('billing/invoices', invoiceId)
    return this.serviceRequest.patch(uri, {
      body: {
        isFlaggedForRebilling
      }
    })
  }
}

module.exports = BillingInvoiceService
