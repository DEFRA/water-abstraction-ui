'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
const constants = require('../../../../src/internal/lib/constants');
const allAdmin = constants.scope.allAdmin;
const routes = require('../../../../src/internal/modules/contact-details/routes');

lab.experiment('contact-details - admin routes', () => {
  lab.test('getContactInformation has admin auth scopes', async () => {
    const route = routes.getContactInformation;
    expect(route.options.auth.scope).to.equal(allAdmin);
  });

  lab.test('postContactInformation has admin auth scopes', async () => {
    const route = routes.postContactInformation;
    expect(route.options.auth.scope).to.equal(allAdmin);
  });
});
