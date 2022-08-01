const ServiceClient = require('shared/lib/connectors/services/ServiceClient')

class ServiceStatusService extends ServiceClient {
  /**
    * Gets the downstream status of the service.
    * @return {Promise} resolves with data
    */
  getServiceStatus () {
    const url = this.joinUrl('service-status')
    return this.serviceRequest.get(url)
  };
}

module.exports = ServiceStatusService
