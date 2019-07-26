'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const constants = require('internal/lib/constants');
const allAdmin = constants.scope.allAdmin;
const routes = require('internal/modules/contact-details/routes');

experiment('contact-details - admin routes', () => {
  test('getContactInformation has admin auth scopes', async () => {
    const route = routes.getContactInformation;
    expect(route.options.auth.scope).to.equal(allAdmin);
  });

  test('postContactInformation has admin auth scopes', async () => {
    const route = routes.postContactInformation;
    expect(route.options.auth.scope).to.equal(allAdmin);
  });
});
