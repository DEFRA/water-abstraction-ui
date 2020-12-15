'use strict';
const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { scope } = require('internal/lib/constants');
const routes = require('../../../../../src/internal/modules/invoice-accounts/routes/invoice-accounts');

experiment('internal/modules/invoice-accounts/routes/invoice-accounts', () => {
  experiment('.getCompany', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.getCompany.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.getCompany.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}');
    });
  });

  experiment('.postCompany', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.postCompany.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.postCompany.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}');
    });
  });

  experiment('.getAddress', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.getAddress.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.getAddress.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/select-address');
    });
  });

  experiment('.getFao', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.getFao.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.getFao.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/add-fao');
    });
  });

  experiment('.postFao', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.postFao.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.postFao.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/add-fao');
    });
  });

  experiment('.getCheckDetails', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.getCheckDetails.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.getCheckDetails.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/check-details');
    });
  });

  experiment('.postCheckDetails', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.postCheckDetails.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.postCheckDetails.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/check-details');
    });
  });
});
