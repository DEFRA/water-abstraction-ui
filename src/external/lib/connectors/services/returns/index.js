const LinesApiClient = require('shared/lib/connectors/services/returns/LinesApiClient');
const ReturnsApiClient = require('shared/lib/connectors/services/returns/ReturnsApiClient');
const VersionsApiClient = require('shared/lib/connectors/services/returns/VersionsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  lines: new LinesApiClient(config, logger),
  returns: new ReturnsApiClient(config, logger),
  versions: new VersionsApiClient(config, logger)
});
