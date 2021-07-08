const ServiceClient = require('../ServiceClient');

class GaugingStationsService extends ServiceClient {
  getAllGaugingStations (options = {}) {
    const url = this.joinUrl('gauging-stations');
    return this.serviceRequest.get(url, options);
  }

  getGaugingStationbyId (stationId, options = {}) {
    const url = this.joinUrl('gauging-stations', stationId);
    return this.serviceRequest.get(url, options);
  }

  getGaugingStationLicences (stationId) {
    const url = this.joinUrl('gauging-stations', stationId, 'licences');
    return this.serviceRequest.get(url);
  }

  getGaugingStationsByLicenceId (licenceId) {
    const url = this.joinUrl('licences', licenceId, 'gauging-stations');
    return this.serviceRequest.get(url);
  }

  postLicenceLinkage (stationId, licenceId, payload = {
    thresholdUnit: null,
    thresholdValue: null,
    abstractionPeriod: null,
    alertType: null,
    licenceVersionPurposeConditionId: null
  }) {
    const url = this.joinUrl('gauging-stations', stationId, 'licences');

    return this.serviceRequest.post(url, {
      body: {
        licenceId,
        ...payload
      }
    });
  }

  postLicenceLinkageRemove (licenceGaugingStationId) {
    const url = this.joinUrl('licence-gauging-stations', licenceGaugingStationId, '');
    return this.serviceRequest.delete(url);
  }
}

module.exports = GaugingStationsService;
