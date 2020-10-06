'use strict';

const config = require('../config');

const { getReturnPath } = require('./return-path');

const services = require('./connectors/services');
const permissions = require('./permissions');

const getLicenceSummaryReturns = licenceNumber => {
  return services.returns.returns.getLicenceReturns([licenceNumber], {
    page: 1,
    perPage: 10
  });
};

exports.getReturnPath = getReturnPath;
exports.getLicenceSummaryReturns = getLicenceSummaryReturns;
exports.getCommunication = services.water.communications.getCommunication.bind(services.water.communications);
exports.getRiverLevel = services.water.riverLevels.getRiverLevel.bind(services.water.riverLevels);
exports.getLicenceAgreements = services.water.licences.getLicenceAgreements.bind(services.water.licences);

/**
 * Should the licence view show charging information to this user?
 *
 * Will be true of the user has the charging role.
 *
 * @param {Object} request The HAPI request object
 * @returns {Boolean} True if this user can see charging details
 */
exports.canShowCharging = request => permissions.isCharging(request);

/**
 * Pass through the feature toggles config property
 * @type {Object}
 */
exports.featureToggles = config.featureToggles;
