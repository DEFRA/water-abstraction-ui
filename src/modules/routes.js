const resetPasswordRoutes = require('./reset-password/routes');
const updatePasswordRoutes = require('./update-password/routes');

module.exports = [
  ...Object.values(resetPasswordRoutes),
  ...Object.values(updatePasswordRoutes)
];
