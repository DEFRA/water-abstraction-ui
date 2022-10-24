'use strict'

// External only routes
const acceptanceTestsProxyRoutes = require('./acceptance-tests-proxy/routes')
const coreRoutes = require('./core/routes')
const contentRoutes = require('./content/routes')
const notificationsRoutes = require('./notifications/routes')
const reportsRoutes = require('./notifications-reports/routes')
const contactDetailsRoutes = require('./contact-details/routes')
const abstractionReformRoutes = require('./abstraction-reform/routes')
const wr22Routes = require('./abstraction-reform/wr22-routes')
const returnsRoutes = require('./returns/routes')
const returnNotificationRoutes = require('./returns-notifications/routes')
const returnsReports = require('./returns-reports/routes')
const internalSearch = require('./internal-search/routes')
const waiting = require('./waiting/routes')
const batchNotifications = require('./batch-notifications/routes')
const accountRoutes = require('./account/routes')
const unlinkLicenceRoutes = require('./unlink-licence/routes')
const billingRoutes = require('./billing/routes')
const chargeInformationRoutes = require('./charge-information/routes')
const chargeInformationUploadRoutes = require('./charge-information-upload/routes')
const agreementsRoutes = require('./agreements/routes')
const reportingRoutes = require('./reporting/routes')
const viewLicences = require('./view-licences/routes')
const gaugingStations = require('./gauging-stations/routes')
const customers = require('./customers/routes')
const notes = require('./notes/routes')

// Shared routes
const healthRoutes = require('../../shared/modules/health/routes')
const kpiReporting = require('../../internal/modules/kpi-reporting/routes')

module.exports = [
  ...Object.values(acceptanceTestsProxyRoutes),
  ...Object.values(coreRoutes),
  ...Object.values(contentRoutes),
  ...Object.values(notificationsRoutes),
  ...Object.values(reportsRoutes),
  ...Object.values(contactDetailsRoutes),
  ...Object.values(abstractionReformRoutes),
  ...Object.values(wr22Routes),
  ...Object.values(returnsRoutes),
  ...Object.values(returnNotificationRoutes),
  ...Object.values(returnsReports),
  ...Object.values(internalSearch),
  ...Object.values(waiting),
  ...Object.values(batchNotifications),
  ...require('./manage/routes'),
  ...Object.values(accountRoutes),
  ...Object.values(unlinkLicenceRoutes),
  ...Object.values(billingRoutes),
  ...Object.values(chargeInformationRoutes),
  ...Object.values(chargeInformationUploadRoutes),
  ...Object.values(agreementsRoutes),
  ...Object.values(reportingRoutes),
  ...Object.values(kpiReporting),
  ...Object.values(viewLicences),
  ...Object.values(gaugingStations),
  ...Object.values(customers),
  ...Object.values(notes),
  ...Object.values(healthRoutes)
]
