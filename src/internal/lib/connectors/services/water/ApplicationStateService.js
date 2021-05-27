const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class ApplicationStateService extends ServiceClient {
  get (key) {
    const uri = this.joinUrl('application-state', key);
    console.log(uri);
    return this.serviceRequest.get(uri);
  }

  set (key, data) {
    const uri = this.joinUrl('application-state', key);
    return this.serviceRequest.post(uri, {
      body: data
    });
  }
}

module.exports = ApplicationStateService;
