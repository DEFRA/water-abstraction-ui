'use strict';

const Lab = require('lab');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const loginHelpers = require('../../../src/lib/login-helpers');
const idmConnector = require('../../../src/lib/connectors/idm');
const signIn = require('../../../src/lib/sign-in');
const controller = require('../../../src/modules/reset-password/controller');

/**
 * Note current version test of 'code' can't test for async function
 * @see {@link https://github.com/hapijs/code/issues/103}
 */
function isAsync (fn) {
  return fn.constructor.name === 'AsyncFunction';
}

experiment('Check methods on reset password controller', () => {
  test('getResetPassword function exists', async () => {
    expect(isAsync(controller.getResetPassword)).to.equal(true);
  });

  test('postResetPassword function exists', async () => {
    expect(isAsync(controller.postResetPassword)).to.equal(true);
  });

  test('getResetSuccess function exists', async () => {
    expect(isAsync(controller.getResetSuccess)).to.equal(true);
  });

  test('getChangePassword function exists', async () => {
    expect(isAsync(controller.getChangePassword)).to.equal(true);
  });

  test('postChangePassword function exists', async () => {
    expect(isAsync(controller.postChangePassword)).to.equal(true);
  });
});

experiment('postChangePassword', () => {
  let h;
  let request;

  beforeEach(async () => {
    h = {
      redirect: sandbox.spy(),
      view: sandbox.spy()
    };

    request = {
      payload: {
        resetGuid: 'test-id',
        password: 'test-password'
      }
    };

    sandbox.stub(idmConnector, 'getUserByResetGuid').resolves({
      user_name: 'test-user-name',
      error: null
    });

    sandbox.stub(idmConnector, 'updatePasswordWithGuid').resolves({
      error: null
    });

    sandbox.stub(loginHelpers, 'getLoginRedirectPath').resolves('test-path');

    sandbox.stub(signIn, 'auto').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('redirects to reset expired if user not found', async () => {
    idmConnector.getUserByResetGuid.resolves(null);
    await controller.postChangePassword(request, h);

    const [redirectPath] = h.redirect.lastCall.args;
    expect(redirectPath).to.equal('/reset_password?flash=resetLinkExpired');
  });

  test('renders the form again for form errors', async () => {
    request.formError = {};
    await controller.postChangePassword(request, h);

    const [view] = h.view.lastCall.args;
    expect(view).to.equal('water/reset-password/reset_password_change_password');
  });

  test('redirects to reset expired if password not updated', async () => {
    idmConnector.updatePasswordWithGuid.resolves({
      error: 'bad'
    });
    await controller.postChangePassword(request, h);

    const [redirectPath] = h.redirect.lastCall.args;
    expect(redirectPath).to.equal('/reset_password?flash=resetLinkExpired');
  });

  experiment('on success', () => {
    test('the user is signed in', async () => {
      await controller.postChangePassword(request, h);
      const [, userName] = signIn.auto.lastCall.args;
      expect(userName).to.equal('test-user-name');
    });

    test('redirects to the return values from the login helper', async () => {
      await controller.postChangePassword(request, h);
      const [redirectPath] = h.redirect.lastCall.args;
      expect(loginHelpers.getLoginRedirectPath.calledWith(request)).to.be.true();
      expect(redirectPath).to.equal('test-path');
    });
  });
});
