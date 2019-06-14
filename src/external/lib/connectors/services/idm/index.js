const UsersApiClient = require('shared/lib/connectors/services/idm/UsersApiClient');
const logger = require('../../../../logger');

module.exports = config => ({
  users: new UsersApiClient(config, logger)
});
