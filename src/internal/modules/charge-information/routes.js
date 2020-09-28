const chargeInformationRoutes = require('./routes/charge-information');
const chargeElementRoutes = require('./routes/charge-element');

module.exports = [
  ...Object.values(chargeInformationRoutes),
  ...Object.values(chargeElementRoutes)
];
