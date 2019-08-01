'use strict';

const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

const { expect } = require('@hapi/code');
const constants = require('internal/lib/constants');
const { hofNotifications, renewalNotifications, hasManageTab } = constants.scope;
const allowedScopes = [hofNotifications, renewalNotifications];
const routes = require('internal/modules/notifications/routes');

lab.experiment('notifications - admin routes', () => {
  lab.test('getStep has HoF / renewal notification scopes', async () => {
    const route = routes.getStep;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('postStep has HoF / renewal notification scopes', async () => {
    const route = routes.postStep;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('getManage has manage tab scopes', async () => {
    const route = routes.getManage;
    expect(route.config.auth.scope).to.only.include(hasManageTab);
  });

  lab.test('getRefine has HoF / renewal notification scopes', async () => {
    const route = routes.getRefine;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('postRefine has HoF / renewal notification scopes', async () => {
    const route = routes.postRefine;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('getVariableData has HoF / renewal notification scopes', async () => {
    const route = routes.getVariableData;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('postVariableData has HoF / renewal notification scopes', async () => {
    const route = routes.postVariableData;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('getPreview has HoF / renewal notification scopes', async () => {
    const route = routes.getPreview;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });

  lab.test('postSend has HoF / renewal notification scopes', async () => {
    const route = routes.postSend;
    expect(route.config.auth.scope).to.only.include(allowedScopes);
  });
});
