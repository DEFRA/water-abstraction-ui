'use strict';

const { expect } = require('code');
const { experiment, test, beforeEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const controller = require('../../../src/modules/auth/controller.js');

experiment('getSignout', () => {
  let request;
  let h;

  beforeEach(async () => {
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

  test('redirects to the signed-out route', async () => {
    const redirectTo = h.redirect.lastCall.args[0];
    expect(redirectTo).to.equal('/signed-out?u=e');
  });

  test('the session is destroyed', async () => {
    expect(request.sessionStore.destroy.callCount).to.equal(1);
  });

  test('the auth cookie is cleared', async () => {
    expect(request.cookieAuth.clear.callCount).to.equal(1);
  });
});

experiment('getSignedOut', () => {
  let h;

  beforeEach(async () => {
    const request = {
      log: sinon.spy(),
      query: { u: 'e' },
      view: {}
    };
    h = { view: sinon.spy() };
    await controller.getSignedOut(request, h);
  });

  test('sets the page title', async () => {
    const viewContext = h.view.lastCall.args[1];
    expect(viewContext.pageTitle).to.equal('You are signed out');
  });

  test('sets the surveyType', async () => {
    const viewContext = h.view.lastCall.args[1];
    expect(viewContext.surveyType).to.equal('external');
  });
});
