const resetPasswordRoutes = require('./reset-password/routes');
const updatePasswordRoutes = require('./update-password/routes');
const viewLicenceRoutes = require('./view-licences/routes');
const viewLicenceAdminRoutes = require('./view-licences/routes-admin');
const viewAbstractionReformRoutes = require('./view-licences/routes-abstraction-reform');

module.exports = [
  ...Object.values(resetPasswordRoutes),
  ...Object.values(updatePasswordRoutes),
  ...Object.values(viewLicenceRoutes),
  ...Object.values(viewLicenceAdminRoutes),
  ...Object.values(viewAbstractionReformRoutes)
];
