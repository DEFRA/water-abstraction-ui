// Shared services
const LicencesService = require('shared/lib/connectors/services/water/LicencesService');
const CommunicationsService = require('shared/lib/connectors/services/water/CommunicationsService');
const CompaniesService = require('shared/lib/connectors/services/water/CompaniesService');
const UsersService = require('shared/lib/connectors/services/water/UsersService');

// Internal services (possibly unique, or overriding shared)
const ReturnsService = require('./ReturnsService');
const BatchNotificationsService = require('./BatchNotificationsService');
const ReturnsNotificationsService = require('./ReturnsNotificationsService');
const InternalSearchService = require('./InternalSearchService');

// API Clients
const NotificationsApiClient = require('./NotificationsApiClient');
const AbstractionReformAnalysisApiClient = require('internal/lib/connectors/services/water/AbstractionReformAnalysisApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  // Shared Services
  licences: new LicencesService(config.services.water, logger),
  communications: new CommunicationsService(config.services.water, logger),
  companies: new CompaniesService(config.services.water, logger),
  users: new UsersService(config.services.water, logger),

  // Internal services
  returns: new ReturnsService(config.services.water, logger),
  batchNotifications: new BatchNotificationsService(config.services.water, logger),
  returnsNotifications: new ReturnsNotificationsService(config.services.water, logger),
  internalSearch: new InternalSearchService(config.services.water, logger),

  // API Clients
  notifications: new NotificationsApiClient(config, logger),
  abstractionReformAnalysis: new AbstractionReformAnalysisApiClient(config, logger)
});
