'use strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/charging/routes');

experiment('internal/modules/charging/routes', () => {
  experiment('.getChargeVersion', () => {
    test('limits scope to users with charges role', async () => {
      expect(routes.getChargeVersion.options.auth.scope)
        .to.only.include([scope.charging]);
    });
  });
});
