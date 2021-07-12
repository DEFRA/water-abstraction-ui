console.log('STARTING CORE');
const coreRoutes = require('./core/routes');
console.log('DONE CORE');
const contentRoutes = require('./content/routes');
console.log('DONE content');
const notificationsRoutes = require('./notifications/routes');
console.log('DONE notif');
const reportsRoutes = require('./notifications-reports/routes');
const contactDetailsRoutes = require('./contact-details/routes');
const abstractionReformRoutes = require('./abstraction-reform/routes');
console.log('DONE abstractionReform');
const wr22Routes = require('./abstraction-reform/wr22-routes');
const returnsRoutes = require('./returns/routes');
const returnNotificationRoutes = require('./returns-notifications/routes');
const returnsReports = require('./returns-reports/routes');
const internalSearch = require('./internal-search/routes');
const waiting = require('./waiting/routes');
console.log('DONE waiting');
const batchNotifications = require('./batch-notifications/routes');
const accountRoutes = require('./account/routes');
const unlinkLicenceRoutes = require('./unlink-licence/routes');
const billingRoutes = require('./billing/routes');
const chargeInformationRoutes = require('./charge-information/routes');
const agreementsRoutes = require('./agreements/routes');
const reportingRoutes = require('./reporting/routes');
const kpiReporting = require('../../internal/modules/kpi-reporting/routes');
const viewLicences = require('./view-licences/routes');
console.log('DONE viewLicences');
const gaugingStations = require('./gauging-stations/routes');

module.exports = [
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
  ...Object.values(agreementsRoutes),
  ...Object.values(reportingRoutes),
  ...Object.values(kpiReporting),
  ...Object.values(viewLicences),
  ...Object.values(gaugingStations)
];
