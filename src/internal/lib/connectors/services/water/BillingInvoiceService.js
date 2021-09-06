const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingInvoiceService extends ServiceClient {
  patchFlagForRebilling (invoiceId, isFlaggedForRebilling = true) {
    const uri = this.joinUrl('billing/invoices', invoiceId);
    return this.serviceRequest.patch(uri, {
      body: {
        isFlaggedForRebilling
      }
    });
  }

  resetIsFlaggedForRebillingByBatch (batchId, originalInvoiceId, rebillInvoiceId) {
    const uri = this.joinUrl(`billing/invoices/rebillingflag/${batchId}/org/${originalInvoiceId}/rebill/${rebillInvoiceId}`);
    return this.serviceRequest.patch(uri);
  }
}

module.exports = BillingInvoiceService;
