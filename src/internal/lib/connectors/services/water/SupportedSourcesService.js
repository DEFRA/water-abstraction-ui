const ServiceClient = require('shared/lib/connectors/services/ServiceClient')

class SupportedSourcesService extends ServiceClient {
  getSupportedSources () {
    const uri = this.joinUrl('supported-sources')
    return this.serviceRequest.get(uri)
  }
}

module.exports = SupportedSourcesService
