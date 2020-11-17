const chargeInformationRoutes = require('./routes/charge-information');
const chargeElementRoutes = require('./routes/charge-element');
const chargeInformationWorkflowRoutes = require('./routes/charge-information-workflow');
const nonChargeableRoutes = require('./routes/non-chargeable');
const viewChargeInformationRoutes = require('./routes/view-charge-information');
const config = require('../../config');

if (config.featureToggles.chargeInformation) {
  module.exports = [
    ...Object.values(chargeInformationRoutes),
    ...Object.values(chargeInformationWorkflowRoutes),
    ...Object.values(chargeElementRoutes),
    ...Object.values(nonChargeableRoutes),
    ...Object.values(viewChargeInformationRoutes)
  ];
};
