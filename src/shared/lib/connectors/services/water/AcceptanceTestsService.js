const ServiceClient = require('../ServiceClient');

class AcceptanceTestsService extends ServiceClient {
  postToPath (path) {
    const url = this.joinUrl('acceptance-tests', path);
    return this.serviceRequest.post(url);
  };
}

module.exports = AcceptanceTestsService;
