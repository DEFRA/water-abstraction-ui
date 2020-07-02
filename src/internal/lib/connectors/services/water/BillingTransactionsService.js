const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingTransactionsService extends ServiceClient {
  updateVolume (transactionId, volume) {
    const uri = this.joinUrl('billing/transactions/', transactionId, '/volume');
    return this.serviceRequest.patch(uri, {
      body: { volume }
    });
  }
}

module.exports = BillingTransactionsService;
