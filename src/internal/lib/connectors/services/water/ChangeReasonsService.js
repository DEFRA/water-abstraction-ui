const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class ChangeReasonsService extends ServiceClient {
  getChangeReasons () {
    const uri = this.joinUrl('change-reasons');
    return this.serviceRequest.get(uri);
  }
}

module.exports = ChangeReasonsService;
