const coreRoutes = require('./core/routes');
const contentRoutes = require('./content/routes');
const updatePasswordRoutes = require('./update-password/routes');
const viewLicenceAdminRoutes = require('./view-licences/routes-admin');
const notificationsRoutes = require('./notifications/routes');
const reportsRoutes = require('./notifications-reports/routes');
const serviceStatusRoutes = require('./service-status/routes');
const contactDetailsRoutes = require('./contact-details/routes');
const abstractionReformRoutes = require('./abstraction-reform/routes');
const wr22Routes = require('./abstraction-reform/wr22-routes');
const returnsRoutes = require('./returns/routes');
const returnNotificationRoutes = require('./returns-notifications/routes');
const returnsReports = require('./returns-reports/routes');
const internalSearch = require('./internal-search/routes');
const waiting = require('./waiting/routes');
const batchNotifications = require('./batch-notifications/routes');

module.exports = [
  ...Object.values(coreRoutes),
  ...Object.values(contentRoutes),
  ...Object.values(updatePasswordRoutes),
  ...Object.values(viewLicenceAdminRoutes),
  ...Object.values(notificationsRoutes),
  ...Object.values(reportsRoutes),
  ...Object.values(serviceStatusRoutes),
  ...Object.values(contactDetailsRoutes),
  ...Object.values(abstractionReformRoutes),
  ...Object.values(wr22Routes),
  ...Object.values(returnsRoutes),
  ...Object.values(returnNotificationRoutes),
  ...Object.values(returnsReports),
  ...Object.values(internalSearch),
  ...Object.values(waiting),
  ...Object.values(batchNotifications)
];
