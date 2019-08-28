'use strict';

const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

const { expect } = require('@hapi/code');
const constants = require('internal/lib/constants');
const { allNotifications } = constants.scope;
const routes = require('internal/modules/notifications-reports/routes');

lab.experiment('notification reports', () => {
  lab.test('getNotificationsList has all notification scopes', async () => {
    const route = routes.getNotificationsList;
    expect(route.config.auth.scope).to.only.include(allNotifications);
  });

  lab.test('getNotification has all notification scopes', async () => {
    const route = routes.getNotification;
    expect(route.config.auth.scope).to.only.include(allNotifications);
  });
});
