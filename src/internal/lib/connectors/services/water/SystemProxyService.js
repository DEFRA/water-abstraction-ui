const ServiceClient = require('shared/lib/connectors/services/ServiceClient')

class SystemProxyService extends ServiceClient {
  async getToPath (path) {
    // joinUrl appends the given path to the service url, hence we still need to call it here
    const url = this.joinUrl(path)
    const result = await this.serviceRequest.get(url)
    return result
  }
}

module.exports = SystemProxyService
