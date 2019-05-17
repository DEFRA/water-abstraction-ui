'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
const constants = require('../../../../src/external/lib/constants');
const allAdmin = constants.scope.allAdmin;
const routes = require('../../../../src/external/modules/notifications-reports/routes');

lab.experiment('notification reports - admin routes', () => {
  lab.test('getNotificationsList has admin auth scopes', async () => {
    const route = routes.getNotificationsList;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getNotification has admin auth scopes', async () => {
    const route = routes.getNotification;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });
});
