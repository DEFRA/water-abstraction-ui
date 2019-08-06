'use strict';

const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

const { expect } = require('@hapi/code');
const constants = require('internal/lib/constants');
const { hofNotifications, renewalNotifications } = constants.scope;
const routes = require('internal/modules/notifications/contact-routes');

const allowedScopes = [hofNotifications, renewalNotifications];

lab.experiment('notifications - contact routes', () => {
  lab.test('getNameAndJob has HoF / renewal notification scopes', async () => {
    const route = routes.getNameAndJob;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('postNameAndJob has HoF / renewal notification scopes', async () => {
    const route = routes.postNameAndJob;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('getDetails has HoF / renewal notification scopes', async () => {
    const route = routes.getDetails;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('postDetails has HoF / renewal notification scopes', async () => {
    const route = routes.postDetails;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });
});
