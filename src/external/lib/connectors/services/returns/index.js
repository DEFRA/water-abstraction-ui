const LinesApiClient = require('shared/lib/connectors/services/returns/LinesApiClient');
const VersionsApiClient = require('shared/lib/connectors/services/returns/VersionsApiClient');

const ReturnsApiClient = require('./ReturnsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  lines: new LinesApiClient(config, logger),
  returns: new ReturnsApiClient(config, logger),
  versions: new VersionsApiClient(config, logger)
});
