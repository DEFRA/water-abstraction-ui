'use strict';

const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingAccountsService extends ServiceClient {
  getBillingAccount (billingAccountId) {
    const uri = this.joinUrl('invoice-accounts', billingAccountId);
    return this.serviceRequest.get(uri);
  }
}
module.exports = BillingAccountsService;
