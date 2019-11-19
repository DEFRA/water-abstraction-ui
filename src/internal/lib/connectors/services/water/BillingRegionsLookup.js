const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingRegionsLookup extends ServiceClient {
  getBillingRegions () {
    const uri = this.joinUrl('regions');
    return this.serviceRequest.get(uri);
  }
}

module.exports = BillingRegionsLookup;
