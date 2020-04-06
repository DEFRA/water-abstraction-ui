const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingTransactionsService extends ServiceClient {
  updateVolume (transactionId, volume) {
    const uri = this.joinUrl('billing/transactions/', transactionId);
    return this.serviceRequest.patch(uri, {
      body: { volume }
    });
  }
}

module.exports = BillingTransactionsService;
