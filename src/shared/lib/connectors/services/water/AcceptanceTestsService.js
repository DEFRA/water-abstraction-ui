const ServiceClient = require('../ServiceClient');

class AcceptanceTestsService extends ServiceClient {
  async postToPath (path, payload) {
    const url = this.joinUrl('acceptance-tests', path);
    return await this.serviceRequest.post(url, { body: payload });
  };
}

module.exports = AcceptanceTestsService;
