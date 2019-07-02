const LicencesApiClient = require('shared/lib/connectors/services/permits/LicencesApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  licences: new LicencesApiClient(config, logger)
});
