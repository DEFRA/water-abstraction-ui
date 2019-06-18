const ServiceClient = require('../ServiceClient');

class CommunicationsService extends ServiceClient {
  getCommunication (communicationId) {
    const url = this.joinUrl('communications', communicationId);
    return this.serviceRequest.get(url);
  }
}

module.exports = CommunicationsService;
