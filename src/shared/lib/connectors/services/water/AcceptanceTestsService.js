const ServiceClient = require('../ServiceClient');

class AcceptanceTestsService extends ServiceClient {
  async postToPath (path, payload) {
    const url = this.joinUrl('acceptance-tests', path);
    const result = await this.serviceRequest.post(url, { body: payload });
    return result;
  };
}

module.exports = AcceptanceTestsService;
