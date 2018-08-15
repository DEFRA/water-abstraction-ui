'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
const constants = require('../../../src/lib/constants');
const allAdmin = constants.scope.allAdmin;
const routes = require('../../../src/modules/notifications/contact-routes');

lab.experiment('notifications - contact routes', () => {
  lab.test('getNameAndJob has admin auth scopes', async () => {
    const route = routes.getNameAndJob;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('postNameAndJob has admin auth scopes', async () => {
    const route = routes.postNameAndJob;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getDetails has admin auth scopes', async () => {
    const route = routes.getDetails;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('postDetails has admin auth scopes', async () => {
    const route = routes.postDetails;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });
});
