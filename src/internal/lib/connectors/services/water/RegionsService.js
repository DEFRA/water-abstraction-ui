const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class RegionsService extends ServiceClient {
  getRegions () {
    const uri = this.joinUrl('regions');
    return this.serviceRequest.get(uri);
  }
}

module.exports = RegionsService;
