const chargeInformationRoutes = require('./routes/charge-information');
const chargeElementRoutes = require('./routes/charge-element');
const nonChargeableRoutes = require('./routes/non-chargeable');
const viewChargeInformationRoutes = require('./routes/view-charge-information');

module.exports = [
  ...Object.values(chargeInformationRoutes),
  ...Object.values(chargeElementRoutes),
  ...Object.values(nonChargeableRoutes),
  ...Object.values(viewChargeInformationRoutes)
];
