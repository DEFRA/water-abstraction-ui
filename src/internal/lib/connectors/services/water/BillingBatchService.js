const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingBatchService extends ServiceClient {
  getBatch (batchId) {
    const uri = this.joinUrl('billing/batches', batchId);
    return this.serviceRequest.get(uri);
  }

  getInvoicesForBatch (batchId) {
    const uri = this.joinUrl('billing/batches', batchId, 'invoices');

    return this.serviceRequest.get(uri);
  }
}

module.exports = BillingBatchService;
