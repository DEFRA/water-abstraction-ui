'use strict';

const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

const { expect } = require('@hapi/code');
const constants = require('internal/lib/constants');
const allAdmin = constants.scope.allAdmin;
const routes = require('internal/modules/notifications/routes');

lab.experiment('notifications - admin routes', () => {
  lab.test('getStep has admin auth scopes', async () => {
    const route = routes.getStep;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('postStep has admin auth scopes', async () => {
    const route = routes.postStep;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getResetPassword has admin auth scopes', async () => {
    const route = routes.getResetPassword;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getRefine has admin auth scopes', async () => {
    const route = routes.getRefine;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('postRefine has admin auth scopes', async () => {
    const route = routes.postRefine;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getVariableData has admin auth scopes', async () => {
    const route = routes.getVariableData;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('postVariableData has admin auth scopes', async () => {
    const route = routes.postVariableData;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('getPreview has admin auth scopes', async () => {
    const route = routes.getPreview;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });

  lab.test('postSend has admin auth scopes', async () => {
    const route = routes.postSend;
    expect(route.config.auth.scope).to.equal(allAdmin);
  });
});
