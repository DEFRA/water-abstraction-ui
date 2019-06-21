const ServiceClient = require('../ServiceClient');

class RiverLevelsService extends ServiceClient {
  /**
   * Get gauging station data
   * @param {String} gaugingStation - the gauging station ID
   * @return {Promise} resolves with gauging station data
   */
  getRiverLevel (gaugingStation) {
    const url = this.joinUrl('river-levels/station', gaugingStation);
    return this.serviceRequest.get(url);
  };
}

module.exports = RiverLevelsService;
