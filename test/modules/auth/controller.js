'use strict';

const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const sinon = require('sinon');
const controller = require('../../../src/modules/auth/controller.js');
const View = require('../../../src/lib/view');

lab.experiment('getSignout', () => {
  let request;
  let h;

  lab.beforeEach(async () => {
    request = {
      sessionStore: { destroy: sinon.stub().resolves(true) },
      cookieAuth: { clear: sinon.spy() },
      permissions: {
        admin: {
          defra: false
        }
      },
      params: {}
    };

    h = { redirect: sinon.spy() };

    await controller.getSignout(request, h);
  });

  lab.test('redirects to the signed-out route', async () => {
    const redirectTo = h.redirect.lastCall.args[0];
    expect(redirectTo).to.equal('/signed-out?u=e');
  });

  lab.test('the session is destroyed', async () => {
    expect(request.sessionStore.destroy.callCount).to.equal(1);
  });

  lab.test('the auth cookie is cleared', async () => {
    expect(request.cookieAuth.clear.callCount).to.equal(1);
  });
});

lab.experiment('getSignedOut', () => {
  let h;

  lab.beforeEach(async () => {
    sinon.stub(View, 'contextDefaults').returns({});
    const request = {
      log: sinon.spy(),
      query: { u: 'e' }
    };
    h = { view: sinon.spy() };
    await controller.getSignedOut(request, h);
  });

  lab.afterEach(async () => {
    View.contextDefaults.restore();
  });

  lab.test('sets the page title', async () => {
    const viewContext = h.view.lastCall.args[1];
    expect(viewContext.pageTitle).to.equal('You are signed out');
  });

  lab.test('sets the surveyType', async () => {
    const viewContext = h.view.lastCall.args[1];
    expect(viewContext.surveyType).to.equal('external');
  });
});
