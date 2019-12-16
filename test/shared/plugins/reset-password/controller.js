'use strict';

const Lab = require('@hapi/lab');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { set } = require('lodash');

const loginHelpers = require('external/lib/login-helpers');
const controller = require('shared/plugins/reset-password/controller');

experiment('reset password controller', () => {
  let h;
  let request;

  beforeEach(async () => {
    h = {
      redirect: sandbox.spy(),
      view: sandbox.spy(),
      realm: {
        pluginOptions: {
          getUserByResetGuid: sandbox.stub().resolves({
            user_id: 'user-1',
            user_name: 'test-user-name',
            error: null
          }),
          updatePasswordWithGuid: sandbox.stub().resolves({
            error: null
          }),
          resetPassword: sandbox.stub()
        }
      }
    };

    request = {
      query: {
        resetGuid: 'test-guid'
      },
      payload: {
        resetGuid: 'test-id',
        password: 'test-password'
      },
      logIn: sandbox.stub().resolves(),
      config: {
        view: 'test-template',
        redirect: 'redirect-path'
      },
      log: sandbox.stub()
    };

    sandbox.stub(loginHelpers, 'getLoginRedirectPath').resolves('test-path');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getResetPassword', () => {
    beforeEach(async () => {
      request.view = { foo: 'bar' };
      await controller.getResetPassword(request, h);
    });

    test('uses the template specified in the config', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('test-template');
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

    test('when the query param is not set, the link expired flag is not set in the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.linkExpired).to.equal(false);
    });

    test('when the query param is set, the link expired flag is set in the view', async () => {
      set(request, 'query.flash', 'resetLinkExpired');
      await controller.getResetPassword(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.linkExpired).to.equal(true);
    });
  });

  experiment('postResetPassword', () => {
    experiment('when the payload is invalid', () => {
      beforeEach(async () => {
        request.payload = {
          email: 'not-an-email'
        };
        await controller.postResetPassword(request, h);
      });

      test('the form page is re-rendered', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('test-template');
      });

      test('the form object has errors', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.form).to.be.an.object();
        expect(view.form.errors).to.have.length(1);
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(async () => {
        request.payload = {
          email: 'bob@example.com'
        };
        await controller.postResetPassword(request, h);
      });

      test('the resetPassword plugin option method is called', async () => {
        expect(h.realm.pluginOptions.resetPassword.calledWith(request.payload.email)).to.be.true();
      });

      test('the user is redirected to the path specified in the request config', async () => {
        expect(h.redirect.calledWith(request.config.redirect)).to.be.true();
      });
    });

    experiment('when an error is thrown by the resetPassword method', () => {
      beforeEach(async () => {
        request.payload = {
          email: 'bob@example.com'
        };
        h.realm.pluginOptions.resetPassword.throws();
        await controller.postResetPassword(request, h);
      });

      test('a message is logged with request.log', async () => {
        const [level, message, error] = request.log.lastCall.args;
        expect(level).to.equal('debug');
        expect(message).to.equal('Reset password error');
        expect(error).to.be.an.object();
      });

      test('the user is redirected to the path specified in the request config', async () => {
        expect(h.redirect.calledWith(request.config.redirect)).to.be.true();
      });
    });
  });

  experiment('getResetSuccess', () => {
    beforeEach(async () => {
      await controller.getResetSuccess(request, h);
    });

    test('renders the template specified in the request config', async () => {
      const [ template ] = h.view.lastCall.args;
      expect(template).to.equal(request.config.view);
    });

    test('outputs the request.view object to the view', async () => {
      const [ , view ] = h.view.lastCall.args;
      expect(view).to.equal(request.view);
    });
  });

  experiment('getChangePassword', () => {
    test('the getUserByResetGuid plugin option method is called with the guid in the request query', async () => {
      await controller.getChangePassword(request, h);
      expect(h.realm.pluginOptions.getUserByResetGuid.calledWith(request.query.resetGuid)).to.be.true();
    });

    experiment('when getUserByResetGuid resolves with a valid user', () => {
      beforeEach(async () => {
        await controller.getChangePassword(request, h);
      });
      test('the correct template is displayed', async () => {
        const [ template ] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/reset-password/change-password');
      });

      test('the request.view object is output to the view', async () => {
        const [ , view ] = h.view.lastCall.args;
        expect(view).to.equal(request.view);
      });
    });

    experiment('when getUserByResetGuid does not resolve with a user', () => {
      beforeEach(async () => {
        h.realm.pluginOptions.getUserByResetGuid.resolves();
        await controller.getChangePassword(request, h);
      });

      test('the user is redirected to reset the password again', async () => {
        expect(h.redirect.calledWith('/reset_password?flash=resetLinkExpired')).to.be.true();
      });
    });
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
      expect(view).to.equal('nunjucks/reset-password/change-password');
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
