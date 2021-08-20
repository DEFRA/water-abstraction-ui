'use strict';

const config = require('../config');

const { getReturnPath } = require('./return-path');

const services = require('./connectors/services');

const getLicenceSummaryReturns = licenceNumber => {
  return services.returns.returns.getLicenceReturns([licenceNumber], {
    page: 1,
    perPage: 10
  });
};

exports.getReturnPath = getReturnPath;
exports.getLicenceSummaryReturns = getLicenceSummaryReturns;
exports.getCommunication = services.water.communications.getCommunication.bind(services.water.communications);

/**
 * Pass through the feature toggles config property
 * @type {Object}
 */
exports.featureToggles = config.featureToggles;

exports.isSummaryPageEnabled = false;
