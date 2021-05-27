'use strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const routes = require('internal/modules/settings/routes');

experiment('internal/modules/settings/routes', () => {
  const allowedScope = 'manage_application_settings';

  experiment('.getSettings', () => {
    test('requires the manage application settings scope', async () => {
      const { scope } = routes.getSettings.options.auth;
      expect(scope).to.only.include(allowedScope);
    });
  });

  experiment('.postSettings', () => {
    test('requires the manage application settings scope', async () => {
      const { scope } = routes.postSettings.options.auth;
      expect(scope).to.only.include(allowedScope);
    });
  });
});
