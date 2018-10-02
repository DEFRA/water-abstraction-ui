'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
const constants = require('../../../src/lib/constants');
const returnsScope = constants.scope.returns;
const routes = require('../../../src/modules/returns-notifications/routes');

lab.experiment('returns notifications', () => {
  lab.test('getSendForms has return scope', async () => {
    const route = routes.getSendForms;
    expect(route.config.auth.scope).to.equal(returnsScope);
  });

  lab.test('postPreviewRecipients has admin auth scopes', async () => {
    const route = routes.postPreviewRecipients;
    expect(route.config.auth.scope).to.equal(returnsScope);
  });

  lab.test('postSendForms has admin auth scopes', async () => {
    const route = routes.postSendForms;
    expect(route.config.auth.scope).to.equal(returnsScope);
  });
});
