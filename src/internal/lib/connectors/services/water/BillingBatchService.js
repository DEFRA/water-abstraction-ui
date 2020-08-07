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

  getBatchLicences (batchId) {
    const uri = this.joinUrl('billing/batches', batchId, 'licences');
    return this.serviceRequest.get(uri);
  }

  /**
   * Gets all the invoices related accounts, licences,
   * transactions, agreements and company data for a batch
   * @param {UUID} batchId
   */
  getBatchInvoicesDetails (batchId) {
    const uri = this.joinUrl('billing/batches', batchId, 'invoices/details');
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

  deleteInvoiceFromBatch (batchId, invoiceId) {
    const uri = this.joinUrl(`/billing/batches/${batchId}/invoices/${invoiceId}`);
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
   * @param {String} batchId UUID of the batch to approve
   */
  approveBatch (batchId) {
    const uri = this.joinUrl(`/billing/batches/${batchId}/approve`);
    return this.serviceRequest.post(uri);
  }

  /**
   * Approves the review stage of a two part tariff batch, the water
   * service will then kick off the next job to continue processing
   * the batch
   *
   * @param {String} batchId UUID of the batch to approve review on
   */
  approveBatchReview (batchId) {
    const uri = this.joinUrl(`/billing/batches/${batchId}/approve-review`);
    return this.serviceRequest.post(uri);
  }

  /**
   * Gets all the billing volumes in the batch for the specified licence
   * @param {String} batchId
   * @param {String} licenceId
   */
  getBatchLicenceBillingVolumes (batchId, licenceId) {
    const uri = this.joinUrl(`/billing/batches/${batchId}/licences/${licenceId}/billing-volumes`);
    return this.serviceRequest.get(uri);
  }

  /**
   * Delete licence from batch - during TPT review process
   * @param {String} batchId
   * @param {String} licenceId
   */
  deleteBatchLicence (batchId, licenceId) {
    const uri = this.joinUrl(`/billing/batches/${batchId}/licences/${licenceId}`);
    return this.serviceRequest.delete(uri);
  }
}

module.exports = BillingBatchService;
