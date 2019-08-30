const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const internalViewLicenceConfig = require('internal/lib/view-licence-config');

const getRequestWithScopes = (scopes = []) => ({
  auth: {
    credentials: {
      scope: scopes
    }
  }
});

experiment('internal/lib/view-licence-config', () => {
  experiment('canShowCharging', () => {
    test('returns false if user does not have charging role', async () => {
      const request = getRequestWithScopes('returns');
      expect(internalViewLicenceConfig.canShowCharging(request)).to.be.false();
    });

    test('returns true if user has the charging role', async () => {
      const request = getRequestWithScopes('charging');
      expect(internalViewLicenceConfig.canShowCharging(request)).to.be.true();
    });
  });
});
