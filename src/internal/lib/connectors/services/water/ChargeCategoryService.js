const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class ChangeReasonsService extends ServiceClient {
  getChargeCategory (chargeCategoryProperties) {
    const uri = this.joinUrl('charge-categories');
    const options = {
      qs: chargeCategoryProperties
    };
    return this.serviceRequest.get(uri, options);
  }
}

module.exports = ChangeReasonsService;
