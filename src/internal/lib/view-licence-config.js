const { internal } = require('./constants').scope;
const { getReturnPath } = require('./return-path');

const services = require('./connectors/services');

const getLicenceSummaryReturns = licenceNumber => {
  return services.returns.returns.getLicenceReturns([licenceNumber], {
    page: 1,
    perPage: 10
  });
};

exports.allowedScopes = [internal];
exports.getReturnPath = getReturnPath;
exports.getLicenceSummaryReturns = getLicenceSummaryReturns;
exports.getCommunication = services.water.communications.getCommunication;
exports.getRiverLevel = services.water.riverLevels.getRiverLevel;
