const BaseLicenceDataConfig = require('../../shared/lib/LicenceDataConfig');

class LicenceDataConfig extends BaseLicenceDataConfig {
  mapRequestToOptions (request) {
    return { companyId: request.defra.companyId };
  }
}

module.exports = LicenceDataConfig;
