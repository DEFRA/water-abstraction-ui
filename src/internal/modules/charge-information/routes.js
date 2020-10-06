const chargeInformationRoutes = require('./routes/charge-information');
const chargeElementRoutes = require('./routes/charge-element');
const chargeVersionRoutes = require('./routes/charge-version');

module.exports = [
  ...Object.values(chargeInformationRoutes),
  ...Object.values(chargeElementRoutes),
  ...Object.values(chargeVersionRoutes)
];
