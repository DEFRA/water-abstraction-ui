const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingBatchCreateService extends ServiceClient {
  getBillingRegions () {
    const uri = this.joinUrl('regions');
    return this.serviceRequest.get(uri);
  }

  createBillingBatch (batch) {
    const uri = this.joinUrl('billing/batches');
    const options = {
      body: batch
    };
    return this.serviceRequest.post(uri, options);
  }
}

module.exports = BillingBatchCreateService;
