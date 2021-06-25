const ServiceClient = require('../ServiceClient');
const config = require('internal/config');
class GaugingStationsService extends ServiceClient {
  getGaugingStationLicences (gaugingStationId) {
    const url = `${config.services.water}/gauging-stations/${gaugingStationId}/licences`;
    return this.serviceRequest.get(url);
  }
}
module.exports = GaugingStationsService;
