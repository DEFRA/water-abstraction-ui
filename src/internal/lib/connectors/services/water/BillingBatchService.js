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

  /**
   * Cancels a batch via the water service which will delete the
   * batch from the charge module, then from the billing_batch
   * tables
   *
   * @param {String} batchId UUID of the batch to cancel
   */
  cancelBatch (batchId) {
    const uri = this.joinUrl(`/billing/batches/${batchId}`);
    return this.serviceRequest.delete(uri);
  }

  /**
   * Approves and sends a batch via the charge module then
   * marks the batch as sent. Any errors in the pipeline will
   * cause the batch to be in the error state.
   *
   * @param {String} batchId UUID of the batch to apprive
   */
  approveBatch (batchId) {
    const uri = this.joinUrl(`/billing/batches/${batchId}/approve`);
    return this.serviceRequest.post(uri);
  }
}

module.exports = BillingBatchService;
