const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingBatchService extends ServiceClient {
  getBatch (batchId) {
    const uri = this.joinUrl('billing/batches', batchId);
    return this.serviceRequest.get(uri);
  }

  getBatches (page, perPage) {
    const uri = this.joinUrl('billing/batches');
    return this.serviceRequest.get(uri, {
      qs: {
        page,
        perPage
      }
    });
  }

  getBatchInvoices (batchId) {
    const uri = this.joinUrl('billing/batches', batchId, 'invoices');
    return this.serviceRequest.get(uri);
  }
}

module.exports = BillingBatchService;
