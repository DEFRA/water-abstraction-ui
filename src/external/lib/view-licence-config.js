'use strict';

const { licenceHolder, colleague, colleagueWithReturns } = require('./constants').scope;
const { getReturnPath } = require('./return-path');
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
exports.getCommunication = services.water.communications.getCommunication.bind(services.water.communications);
exports.getRiverLevel = services.water.riverLevels.getRiverLevel.bind(services.water.riverLevels);
exports.getLicenceAgreements = services.water.licences.getLicenceAgreements.bind(services.water.licences);

/**
 * Should the licence view show charging information to this external user?
 *
 * Always set to false for now whilst under construction.
 *
 * @param {Object} request The HAPI request object
 * @returns {Boolean} True if this user can see charging details
 */
exports.canShowCharging = request => false;
