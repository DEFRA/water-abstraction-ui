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

  getBatchInvoice (batchId, invoiceId) {
    const uri = this.joinUrl(`billing/batches/${batchId}/invoices/${invoiceId}`);
    return this.serviceRequest.get(uri);
  }

  createBillingBatch (batch) {
    const uri = this.joinUrl('billing/batches');
    const options = {
      body: batch
    };
    return this.serviceRequest.post(uri, options);
  }

  deleteAccountFromBatch (batchId, accountId) {
    const uri = this.joinUrl(`/billing/batches/${batchId}/account/${accountId}`);
    return this.serviceRequest.delete(uri);
  }
}

module.exports = BillingBatchService;
