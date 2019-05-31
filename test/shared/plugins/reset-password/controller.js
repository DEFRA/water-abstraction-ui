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

const loginHelpers = require('../../../../src/external/lib/login-helpers');
const controller = require('../../../../src/shared/plugins/reset-password/controller');

/**
 * Note current version test of 'code' can't test for async function
 * @see {@link https://github.com/hapijs/code/issues/103}
 */
function isAsync (fn) {
  return fn.constructor.name === 'AsyncFunction';
}

experiment('reset password controller', () => {
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

  let h;
  let request;

  beforeEach(async () => {
    h = {
      redirect: sandbox.spy(),
      view: sandbox.spy(),
      realm: {
        pluginOptions: {
          getUserByResetGuid: sandbox.stub().resolves({
            user_name: 'test-user-name',
            error: null
          }),
          updatePasswordWithGuid: sandbox.stub().resolves({
            error: null
          })
        }
      }
    };

    request = {
      payload: {
        resetGuid: 'test-id',
        password: 'test-password'
      },
      logIn: sandbox.stub().resolves(),
      config: {}
    };

    sandbox.stub(loginHelpers, 'getLoginRedirectPath').resolves('test-path');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getResetPassword', () => {
    beforeEach(async () => {
      request.config.view = 'test-template';
      request.view = { foo: 'bar' };
      await controller.getResetPassword(request, h);
    });

    test('uses the template specified in the config', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('test-template');
    });

    test('sets the layout view option to false', async () => {
      const [, , options] = h.view.lastCall.args;
      expect(options.layout).to.equal(false);
    });

    test('uses the view data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
    });

    test('creates a form object', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.form).to.be.an.object();
    });

    test('uses the form object argument if supplied', async () => {
      await controller.getResetPassword(request, h, { foo: 'bar' });
      const [, view] = h.view.lastCall.args;
      expect(view.form).to.equal({ foo: 'bar' });
    });
  });

  experiment('postResetPassword', () => {

  });

  experiment('postChangePassword', () => {
    test('redirects to reset expired if user not found', async () => {
      h.realm.pluginOptions.getUserByResetGuid.resolves(null);
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
      h.realm.pluginOptions.updatePasswordWithGuid.resolves({
        error: 'bad'
      });
      await controller.postChangePassword(request, h);

      const [redirectPath] = h.redirect.lastCall.args;
      expect(redirectPath).to.equal('/reset_password?flash=resetLinkExpired');
    });

    experiment('on success', () => {
      test('the user is signed in', async () => {
        await controller.postChangePassword(request, h);
        const [user] = request.logIn.lastCall.args;
        expect(user.user_name).to.equal('test-user-name');
      });
    });
  });
});
