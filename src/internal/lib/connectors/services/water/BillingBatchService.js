const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingBatchService extends ServiceClient {
  getBatch (batchId, includeTotals = false) {
    const uri = this.joinUrl('billing/batches', batchId);
    const options = {
      qs: {
        totals: includeTotals ? 1 : 0
      }
    };
    return this.serviceRequest.get(uri, options);
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
