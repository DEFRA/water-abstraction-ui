const { licenceHolder, colleague, colleagueWithReturns } = require('./constants').scope;
const { getReturnPath } = require('./return-path');
const communicationsConnector = require('./connectors/water-service/communications');
const waterConnector = require('./connectors/water');

const services = require('./connectors/services');

const getLicenceSummaryReturns = licenceNumber => {
  return services.returns.returns.getLicenceReturns([licenceNumber], {
    page: 1,
    perPage: 10
  });
};

exports.allowedScopes = [licenceHolder, colleague, colleagueWithReturns];
exports.getReturnPath = getReturnPath;
exports.getLicenceSummaryReturns = getLicenceSummaryReturns;
exports.getCommunication = communicationsConnector.getCommunication;
exports.getRiverLevel = waterConnector.getRiverLevel;
