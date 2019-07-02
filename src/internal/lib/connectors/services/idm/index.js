const UsersApiClient = require('shared/lib/connectors/services/idm/UsersApiClient');
const KpiApiClient = require('shared/lib/connectors/services/idm/KpiApiClient');
const { logger } = require('../../../../logger');

module.exports = config => ({
  users: new UsersApiClient(config, logger),
  kpis: new KpiApiClient(config, logger)
});
