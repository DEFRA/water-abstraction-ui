'use strict';
const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { scope } = require('internal/lib/constants');
const routes = require('../../../../../src/internal/modules/invoice-accounts/routes/contacts');

experiment('internal/modules/invoice-accounts/routes/contacts', () => {
  experiment('.getSelectContact', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.getContactSelect.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.getContactSelect.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/select-contact');
    });
  });

  experiment('.postCOntactSelect', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.postContactSelect.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.postContactSelect.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/select-contact');
    });
  });
  experiment('.getSelectCreate', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.getContactCreate.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.getContactCreate.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/create-contact');
    });
  });

  experiment('.postCOntactSelect', () => {
    test('limits scope to users with charing role', async () => {
      expect(routes.postContactCreate.config.auth.scope)
        .to.only.include([scope.charging]);
    });
    test('has the correct path', () => {
      expect(routes.postContactCreate.path)
        .to.equal('/invoice-accounts/create/{regionId}/{companyId}/create-contact');
    });
  });
});
