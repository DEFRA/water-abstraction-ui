// Shared services
const CommunicationsService = require('shared/lib/connectors/services/water/CommunicationsService');
const CompaniesService = require('shared/lib/connectors/services/water/CompaniesService');
const LicencesService = require('shared/lib/connectors/services/water/LicencesService');
const RiverLevelsService = require('shared/lib/connectors/services/water/RiverLevelsService');
const ServiceStatusService = require('shared/lib/connectors/services/water/ServiceStatusService');
const UsersService = require('shared/lib/connectors/services/water/UsersService');
const ChargeVersionsService = require('shared/lib/connectors/services/water/ChargeVersionsService');

// Internal services (possibly unique, or overriding shared)
const ReturnsService = require('./ReturnsService');
const BatchNotificationsService = require('./BatchNotificationsService');
const ReturnsNotificationsService = require('./ReturnsNotificationsService');
const InternalSearchService = require('./InternalSearchService');
const BillingBatchCreateService = require('./BillingBatchCreateService');

// Shared API Clients
const EventsApiClient = require('shared/lib/connectors/services/water/EventsApiClient');
const GaugingStationsApiClient = require('shared/lib/connectors/services/water/GaugingStationsApiClient');
const PendingImportsApiClient = require('shared/lib/connectors/services/water/PendingImportsApiClient');

// API Clients
const AbstractionReformAnalysisApiClient = require('./AbstractionReformAnalysisApiClient');
const LookupsApiClient = require('./LookupsApiClient');
const NotificationsApiClient = require('./NotificationsApiClient');
const PicklistsApiClient = require('./PicklistsApiClient');
const PicklistItemsApiClient = require('./PicklistItemsApiClient');
const TaskConfigsApiClient = require('./TaskConfigsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  // Shared Services
  communications: new CommunicationsService(config.services.water, logger),
  companies: new CompaniesService(config.services.water, logger),
  licences: new LicencesService(config.services.water, logger),
  riverLevels: new RiverLevelsService(config.services.water, logger),
  serviceStatus: new ServiceStatusService(config.services.water, logger),
  users: new UsersService(config.services.water, logger),
  chargeVersions: new ChargeVersionsService(config.services.water, logger),

  // Internal services
  returns: new ReturnsService(config.services.water, logger),
  batchNotifications: new BatchNotificationsService(config.services.water, logger),
  returnsNotifications: new ReturnsNotificationsService(config.services.water, logger),
  internalSearch: new InternalSearchService(config.services.water, logger),
  billingBatchCreateService: new BillingBatchCreateService(config.services.water, logger),

  // Shared API Clients
  abstractionReformAnalysis: new AbstractionReformAnalysisApiClient(config, logger),
  lookups: new LookupsApiClient(config, logger),
  gaugingStations: new GaugingStationsApiClient(config, logger),
  notifications: new NotificationsApiClient(config, logger),
  taskConfigs: new TaskConfigsApiClient(config, logger),

  // API Clients
  events: new EventsApiClient(config, logger),
  pendingImports: new PendingImportsApiClient(config, logger),
  picklists: new PicklistsApiClient(config, logger),
  picklistItems: new PicklistItemsApiClient(config, logger)
});
