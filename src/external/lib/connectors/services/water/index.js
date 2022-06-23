// Shared services
const AcceptanceTestsService = require('shared/lib/connectors/services/water/AcceptanceTestsService')
const CommunicationsService = require('shared/lib/connectors/services/water/CommunicationsService')
const CompaniesService = require('shared/lib/connectors/services/water/CompaniesService')
const DocumentsService = require('shared/lib/connectors/services/water/DocumentsService')
const LicencesService = require('shared/lib/connectors/services/water/LicencesService')
const ReturnsService = require('shared/lib/connectors/services/water/ReturnsService')
const UsersService = require('shared/lib/connectors/services/water/UsersService')
const NotifyService = require('shared/lib/connectors/services/water/NotifyService')

// Shared API Clients
const EventsApiClient = require('shared/lib/connectors/services/water/EventsApiClient')
const GaugingStationsApiClient = require('shared/lib/connectors/services/water/GaugingStationsApiClient')
const PendingImportsApiClient = require('shared/lib/connectors/services/water/PendingImportsApiClient')

// Services
const ChangeEmailAddressService = require('./ChangeEmailAddressService')

// API Clients
const NotificationsApiClient = require('./NotificationsApiClient')

const { logger } = require('../../../../logger')

module.exports = config => ({
  // Shared services
  acceptanceTests: new AcceptanceTestsService(config.services.water, logger),
  communications: new CommunicationsService(config.services.water, logger),
  companies: new CompaniesService(config.services.water, logger),
  documents: new DocumentsService(config.services.water, logger),
  licences: new LicencesService(config.services.water, logger),
  returns: new ReturnsService(config.services.water, logger),
  users: new UsersService(config.services.water, logger),
  notify: new NotifyService(config.services.water, logger),

  // Shared API Clients
  events: new EventsApiClient(config, logger),
  gaugingStations: new GaugingStationsApiClient(config, logger),
  pendingImports: new PendingImportsApiClient(config, logger),

  // Services
  changeEmailAddress: new ChangeEmailAddressService(config.services.water, logger),

  // API Clients
  notifications: new NotificationsApiClient(config, logger)
})
