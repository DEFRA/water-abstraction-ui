const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class InternalSearchService extends ServiceClient {
  getInternalSearchResults (query, page = 1) {
    const uri = this.joinUrl('internal-search');
    return this.serviceRequest.get(uri, {
      qs: {
        query,
        page
      }
    });
  }
}

module.exports = InternalSearchService;
