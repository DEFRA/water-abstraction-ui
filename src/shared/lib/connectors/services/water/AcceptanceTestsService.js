const ServiceClient = require('../ServiceClient');

class AcceptanceTestsService extends ServiceClient {
  async postToPath (path) {
    const url = this.joinUrl('acceptance-tests', path);
    const result = await this.serviceRequest.post(url);
    return result;
  };
}

module.exports = AcceptanceTestsService;
