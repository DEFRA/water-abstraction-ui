'use strict';

const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

const { expect } = require('@hapi/code');
const constants = require('internal/lib/constants');
const { bulkReturnNotifications } = constants.scope;
const routes = require('internal/modules/returns-notifications/routes/batch-notifications');

lab.experiment('/internal/modules/returns-notifications/routes/batch-notifications', () => {
  lab.test('getReturnsReminderStart has bulkReturnNotifications scope', async () => {
    const route = routes.getReturnsReminderStart;
    expect(route.config.auth.scope).to.equal(bulkReturnNotifications);
  });

  lab.test('postReturnsReminderStart has bulkReturnNotifications scope', async () => {
    const route = routes.postReturnsReminderStart;
    expect(route.config.auth.scope).to.equal(bulkReturnNotifications);
  });

  lab.test('getReturnsInvitationsStart has bulkReturnNotifications scope', async () => {
    const route = routes.getReturnsInvitationsStart;
    expect(route.config.auth.scope).to.equal(bulkReturnNotifications);
  });

  lab.test('postReturnsInvitationsStart has bulkReturnNotifications scope', async () => {
    const route = routes.postReturnsInvitationsStart;
    expect(route.config.auth.scope).to.equal(bulkReturnNotifications);
  });
});
