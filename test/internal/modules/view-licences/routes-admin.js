'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
const constants = require('../../../../src/internal/lib/constants');
const allAdmin = constants.scope.allAdmin;

const adminRoutes = require('../../../../src/internal/modules/view-licences/routes-admin');

lab.experiment('view-licences - admin routes', () => {
  lab.test('getLicenceAdmin has admin auth scopes', async () => {
    const route = adminRoutes.getLicenceAdmin;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getLicencePurposesAdmin has admin auth scopes', async () => {
    const route = adminRoutes.getLicencePurposesAdmin;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getLicenceContactAdmin has admin auth scopes', async () => {
    const route = adminRoutes.getLicenceContactAdmin;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getLicencePointsAdmin has admin auth scopes', async () => {
    const route = adminRoutes.getLicencePointsAdmin;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getLicenceConditionsAdmin has admin auth scopes', async () => {
    const route = adminRoutes.getLicenceConditionsAdmin;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getLicenceGaugingStationAdmin has admin auth scopes', async () => {
    const route = adminRoutes.getLicenceGaugingStationAdmin;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });
});
