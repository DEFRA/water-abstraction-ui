'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');
const LicenceDataConfig = require('../../../src/external/lib/LicenceDataConfig');

experiment('external LicenceDataConfig', () => {
  test('mapRequestToOptions', async () => {
    const request = {
      defra: {
        companyId: 'company_1'
      }
    };

    const licenceDataConfig = new LicenceDataConfig();
    const result = licenceDataConfig.mapRequestToOptions(request);

    expect(result).to.equal({ companyId: 'company_1' });
  });
});
