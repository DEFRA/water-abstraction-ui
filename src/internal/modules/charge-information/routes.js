const chargeInformationRoutes = require('./routes/charge-information');
const chargeElementRoutes = require('./routes/charge-element');
const nonChargeableRoutes = require('./routes/non-chargeable');

const config = require('../../config');

if (config.featureToggles.chargeInformation) {
  module.exports = [
    ...Object.values(chargeInformationRoutes),
    ...Object.values(chargeElementRoutes),
    ...Object.values(nonChargeableRoutes)
  ];
};
