const LicencesService = require('shared/lib/connectors/services/water/LicencesService');
const CommunicationsService = require('shared/lib/connectors/services/water/CommunicationsService');
const CompaniesService = require('shared/lib/connectors/services/water/CompaniesService');
const ReturnsService = require('shared/lib/connectors/services/water/ReturnsService');
const UsersService = require('shared/lib/connectors/services/water/UsersService');

const NotificationsApiClient = require('./NotificationsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  licences: new LicencesService(config.services.water, logger),
  communications: new CommunicationsService(config.services.water, logger),
  companies: new CompaniesService(config.services.water, logger),
  returns: new ReturnsService(config.services.water, logger),
  users: new UsersService(config.services.water, logger),

  notifications: new NotificationsApiClient(config, logger)
});
