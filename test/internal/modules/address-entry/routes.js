'use strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/address-entry/routes');

experiment('internal/modules/address-entry/routes', () => {
  experiment('.getPostcode', () => {
    test('limits scope to users with charges role', async () => {
      expect(routes.getPostcode.options.auth.scope)
        .to.only.include([scope.charging]);
    });
  });

  experiment('.postSelectAddress', () => {
    test('limits scope to users with charges role', async () => {
      expect(routes.postSelectAddress.options.auth.scope)
        .to.only.include([scope.charging]);
    });
  });

  experiment('.getManualAddressEntry', () => {
    test('limits scope to users with charges role', async () => {
      expect(routes.getManualAddressEntry.options.auth.scope)
        .to.only.include([scope.charging]);
    });
  });

  experiment('.postManualAddressEntry', () => {
    test('limits scope to users with charges role', async () => {
      expect(routes.postManualAddressEntry.options.auth.scope)
        .to.only.include([scope.charging]);
    });
  });
});
