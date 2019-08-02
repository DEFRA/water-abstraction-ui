'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/manage/routes');
const { find } = require('lodash');

experiment('manage - routes', () => {
  experiment('manage route', () => {
    test('has the manage  scope', async () => {
      const route = find(routes, { path: '/manage' });
      expect(route.config.auth.scope).to.only.include(scope.hasManageTab);
    });
  });
});
