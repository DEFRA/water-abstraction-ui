// Shared services
const CommunicationsService = require('shared/lib/connectors/services/water/CommunicationsService');
const CompaniesService = require('shared/lib/connectors/services/water/CompaniesService');
const LicencesService = require('shared/lib/connectors/services/water/LicencesService');
const UsersService = require('shared/lib/connectors/services/water/UsersService');
const ChargeVersionsService = require('shared/lib/connectors/services/water/ChargeVersionsService');
const ChargeVersionWorkflowsService = require('shared/lib/connectors/services/water/ChargeVersionWorkflowsService');

// Internal services (possibly unique, or overriding shared)
const ApplicationStateService = require('./ApplicationStateService');
const ReturnsService = require('./ReturnsService');
const BatchNotificationsService = require('./BatchNotificationsService');
const ChangeReasonsService = require('./ChangeReasonsService');
const ReturnsNotificationsService = require('./ReturnsNotificationsService');
const ReturnCyclesService = require('./ReturnCyclesService');
const InternalSearchService = require('./InternalSearchService');
const InvoiceAccountService = require('./InvoiceAccountService');
const AddressSearchService = require('./AddressSearchService');
const BillingBatchService = require('./BillingBatchService');
const BillingInvoiceService = require('./BillingInvoiceService');
const BillingInvoiceLicenceService = require('./BillingInvoiceLicenceService');
const BillingVolumesService = require('./BillingVolumeService');
const ServiceStatusService = require('internal/lib/connectors/services/water/ServiceStatusService');
const RegionsService = require('./RegionsService');
const AgreementsService = require('./AgreementsService');
const KpiReportingService = require('./KpiReportingService');
const ReportingService = require('./ReportingService');

// Shared API Clients
const EventsApiClient = require('shared/lib/connectors/services/water/EventsApiClient');
const GaugingStationsApiClient = require('shared/lib/connectors/services/water/GaugingStationsApiClient');
const PendingImportsApiClient = require('shared/lib/connectors/services/water/PendingImportsApiClient');

// API Clients
const AbstractionReformAnalysisApiClient = require('./AbstractionReformAnalysisApiClient');
const NotificationsApiClient = require('./NotificationsApiClient');
const TaskConfigsApiClient = require('./TaskConfigsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  // Shared Services
  chargeVersions: new ChargeVersionsService(config.services.water, logger),
  chargeVersionWorkflows: new ChargeVersionWorkflowsService(config.services.water, logger),
  communications: new CommunicationsService(config.services.water, logger),
  companies: new CompaniesService(config.services.water, logger),
  licences: new LicencesService(config.services.water, logger),
  users: new UsersService(config.services.water, logger),

  // Internal services
  addressSearch: new AddressSearchService(config.services.water, logger),
  agreements: new AgreementsService(config.services.water, logger),
  applicationState: new ApplicationStateService(config.services.water, logger),
  batchNotifications: new BatchNotificationsService(config.services.water, logger),
  billingBatches: new BillingBatchService(config.services.water, logger),
  billingInvoices: new BillingInvoiceService(config.services.water, logger),
  billingInvoiceLicences: new BillingInvoiceLicenceService(config.services.water, logger),
  billingVolumes: new BillingVolumesService(config.services.water, logger),
  changeReasons: new ChangeReasonsService(config.services.water, logger),
  invoiceAccounts: new InvoiceAccountService(config.services.water, logger),
  internalSearch: new InternalSearchService(config.services.water, logger),
  regions: new RegionsService(config.services.water, logger),
  returns: new ReturnsService(config.services.water, logger),
  returnCycles: new ReturnCyclesService(config.services.water, logger),
  serviceStatus: new ServiceStatusService(config.services.water, logger),
  returnsNotifications: new ReturnsNotificationsService(config.services.water, logger),
  kpiReporting: new KpiReportingService(config.services.water, logger),
  reporting: new ReportingService(config.services.water, logger),

  // Shared API Clients
  abstractionReformAnalysis: new AbstractionReformAnalysisApiClient(config, logger),
  gaugingStations: new GaugingStationsApiClient(config, logger),
  notifications: new NotificationsApiClient(config, logger),
  taskConfigs: new TaskConfigsApiClient(config, logger),

  // API Clients
  events: new EventsApiClient(config, logger),
  pendingImports: new PendingImportsApiClient(config, logger)
});
