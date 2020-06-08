'use strict';

/**
 * A hapi plugin to get/set an object from the cache for creating
 * a new charge version
 */

const generateChargeVersion = licenceId => ({
  licenceId,
  changeReason: null,
  startDate: null,
  chargeElements: [],
  invoiceAccount: null
});

/**
 * Creates a cache policy for draft charge information and
 * specifies default shape
 * @param {Object} server - hapi server
 */
const createDraftChargeInformationPolicy = server => server.cache({
  expiresIn: 1000 * 60 * 60 * 24 * 365, // 1 year
  segment: 'draftChargeInformation',
  generateFunc: generateChargeVersion,
  generateTimeout: 2000
});

const chargeInformationPlugin = {
  register: server => {
    const policy = createDraftChargeInformationPolicy(server);
    server.method('getDraftChargeInformation', licenceId => policy.get(licenceId));
    server.method('setDraftChargeInformation', (licenceId, data) => policy.set(licenceId, data));
  },

  pkg: {
    name: 'chargeInformationPlugin',
    version: '1.0.0'
  }
};

module.exports = chargeInformationPlugin;
module.exports._generateChargeVersion = generateChargeVersion;
