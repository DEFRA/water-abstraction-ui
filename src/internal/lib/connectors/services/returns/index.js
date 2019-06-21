// API Clients
const ReturnsApiClient = require('./ReturnsApiClient');

// Shared API Clients
const LinesApiClient = require('shared/lib/connectors/services/returns/LinesApiClient');
const VersionsApiClient = require('shared/lib/connectors/services/returns/VersionsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
// API Clients
  returns: new ReturnsApiClient(config, logger),

  // Shared API Clients
  lines: new LinesApiClient(config, logger),
  versions: new VersionsApiClient(config, logger)
});
