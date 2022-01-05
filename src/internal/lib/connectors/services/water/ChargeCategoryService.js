const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class ChangeReasonsService extends ServiceClient {
  getChargeCategory (filter) {
    const uri = this.joinUrl('charge-categories');
    const options = {
      qs: filter
    };
    return this.serviceRequest.get(uri, options);
  }
}

module.exports = ChangeReasonsService;
