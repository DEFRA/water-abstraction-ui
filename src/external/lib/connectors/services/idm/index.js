const UsersApiClient = require('./UsersApiClient');
const { logger } = require('../../../../logger');

module.exports = config => ({
  users: new UsersApiClient(config, logger)
});
