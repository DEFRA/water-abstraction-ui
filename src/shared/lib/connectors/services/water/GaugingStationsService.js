const ServiceClient = require('../ServiceClient');
const config = require('internal/config');
class GaugingStationsService extends ServiceClient {
  getGaugingStationLicences (gaugingStationId) {
    const id = gaugingStationId;
    const url = `${config.services.water}/gauging-stations/${id}/licences`;
    return this.serviceRequest.get(url);
  };
  getGaugingStationsByLicenceId (licenceId) {
    const url = `${config.services.water}/licences/${licenceId}/gauging-stations`;
    return this.serviceRequest.get(url);
  };
}
module.exports = GaugingStationsService;
