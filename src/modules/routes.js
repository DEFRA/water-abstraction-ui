const resetPasswordRoutes = require('./reset-password/routes');
const updatePasswordRoutes = require('./update-password/routes');
const viewLicenceRoutes = require('./view-licences/routes');

module.exports = [
  ...Object.values(resetPasswordRoutes),
  ...Object.values(updatePasswordRoutes),
  ...Object.values(viewLicenceRoutes)
];
