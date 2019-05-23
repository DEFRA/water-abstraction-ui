'use strict';

const { experiment, test } = exports.lab = require('lab').script();

const { expect } = require('code');
const constants = require('../../../../src/external/lib/constants');
const allAdmin = constants.scope.allAdmin;
const routes = require('../../../../src/external/modules/contact-details/routes');

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
