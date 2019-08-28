'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const constants = require('internal/lib/constants');
const { hofNotifications, renewalNotifications } = constants.scope;
const routes = require('internal/modules/contact-details/routes');

const allowedScopes = [hofNotifications, renewalNotifications];

experiment('contact-details - admin routes', () => {
  test('getContactInformation has HoF/renewal scopes', async () => {
    const route = routes.getContactInformation;
    expect(route.options.auth.scope).to.only.include(allowedScopes);
  });

  test('postContactInformation has HoF/renewal scopes', async () => {
    const route = routes.postContactInformation;
    expect(route.options.auth.scope).to.only.include(allowedScopes);
  });
});
