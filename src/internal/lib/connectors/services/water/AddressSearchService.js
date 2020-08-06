const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class AddressSearchService extends ServiceClient {
  getAddressSearchResults (query) {
    const uri = this.joinUrl('address-search');
    return this.serviceRequest.get(uri, {
      qs: {
        q: query
      }
    });
  }
}

module.exports = AddressSearchService;
