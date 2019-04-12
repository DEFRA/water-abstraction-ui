const addLicencesRoutes = require('./add-licences/routes');
const authRoutes = require('./auth/routes');
const coreRoutes = require('./core/routes');
const contentRoutes = require('./content/routes');
const manageLicencesRoutes = require('./manage-licences/routes');
const resetPasswordRoutes = require('./reset-password/routes');
const updatePasswordRoutes = require('./update-password/routes');
const viewLicenceRoutes = require('./view-licences/routes');
const viewLicenceAdminRoutes = require('./view-licences/routes-admin');
const notificationsRoutes = require('./notifications/routes');
const reportsRoutes = require('./notifications-reports/routes');
const registrationRoutes = require('./registration/routes');
const serviceStatusRoutes = require('./service-status/routes');
const contactDetailsRoutes = require('./contact-details/routes');
const abstractionReformRoutes = require('./abstraction-reform/routes');
const wr22Routes = require('./abstraction-reform/wr22-routes');
const returnsRoutes = require('./returns/routes');
const returnNotificationRoutes = require('./returns-notifications/routes');
const cspRoutes = require('./csp/routes');
const returnsReports = require('./returns-reports/routes');
const internalSearch = require('./internal-search/routes');
const waiting = require('./waiting/routes');

module.exports = [
  ...Object.values(addLicencesRoutes),
  ...Object.values(authRoutes),
  ...Object.values(coreRoutes),
  ...Object.values(contentRoutes),
  ...Object.values(registrationRoutes),
  ...Object.values(manageLicencesRoutes),
  ...Object.values(resetPasswordRoutes),
  ...Object.values(updatePasswordRoutes),
  ...Object.values(viewLicenceRoutes),
  ...Object.values(viewLicenceAdminRoutes),
  ...Object.values(notificationsRoutes),
  ...Object.values(reportsRoutes),
  ...Object.values(serviceStatusRoutes),
  ...Object.values(contactDetailsRoutes),
  ...Object.values(abstractionReformRoutes),
  ...Object.values(wr22Routes),
  ...Object.values(returnsRoutes),
  ...Object.values(returnNotificationRoutes),
  ...Object.values(cspRoutes),
  ...Object.values(returnsReports),
  ...Object.values(internalSearch),
  ...Object.values(waiting)
];
