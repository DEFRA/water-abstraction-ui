'use strict';

const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { set, find } = require('lodash');

const IDM = require('../../../../src/external/lib/connectors/idm');
const signIn = require('../../../../src/external/lib/sign-in');
const controller = require('../../../../src/external/modules/auth/controller.js');
const helpers = require('../../../../src/external/modules/auth/helpers.js');

const createRequest = (options = {}) => {
  return Object.assign({}, {
    sessionStore: { destroy: sandbox.stub().resolves(true) },
    cookieAuth: { clear: sandbox.spy() },
    permissions: {
      admin: {
        defra: false
      }
    },
    params: {},
    view: {}
  }, options);
};

const createToolkit = () => {
  return {
    redirect: sandbox.spy(),
    realm: {
      pluginOptions: {
        onSignOut: sandbox.spy(),
        onSignIn: sandbox.spy(),
        ifAuthenticated: sandbox.spy()
      }
    },
    view: sandbox.spy()
  };
};

experiment('auth controller', () => {
  let h;

  beforeEach(async () => {
    h = createToolkit();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getSignin', () => {
    let request;

    experiment('when user is authenticated', () => {
      beforeEach(async () => {
        request = {
          ...createRequest(),
          state: {
            sid: 'session_cookie'
          } };
        await controller.getSignin(request, h);
      });
      test('calls ifAuthenticated handler in plugin options if user already signed in', async () => {
        expect(h.realm.pluginOptions.ifAuthenticated.callCount).to.equal(1);
      });
    });

    experiment('when user is not authenticated', () => {
      beforeEach(async () => {
        request = createRequest();
      });

      test('sets correct data in the view', async () => {
        await controller.getSignin(request, h);
        const [, view] = h.view.lastCall.args;
        expect(view.form).to.be.an.object();
        expect(view.pageTitle).to.equal('Sign in');
        expect(view.showResetMessage).to.equal(false);
      });

      test('sets the showResetMessage flag in the view if the query param is set', async () => {
        set(request, 'query.flash', 'password-reset');
        await controller.getSignin(request, h);
        const [, view] = h.view.lastCall.args;
        expect(view.showResetMessage).to.equal(true);
      });

      test('allows a custom form object to be passed in', async () => {
        const form = { foo: 'bar' };
        await controller.getSignin(request, h, form);
        const [, view] = h.view.lastCall.args;
        expect(view.form).to.equal(form);
      });
    });
  });

  experiment('getSignout', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
      await controller.getSignout(request, h);
    });

    test('calls the onSignOut handler in the plugin options', async () => {
      expect(h.realm.pluginOptions.onSignOut.callCount).to.equal(1);
    });

    test('the session is destroyed', async () => {
      expect(request.sessionStore.destroy.callCount).to.equal(1);
    });

    test('the auth cookie is cleared', async () => {
      expect(request.cookieAuth.clear.callCount).to.equal(1);
    });
  });

  experiment('getSignedOut', () => {
    beforeEach(async () => {
      const request = createRequest({
        query: { u: 'e' }
      });
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

  experiment('postSignin', () => {
    beforeEach(async () => {
      sandbox.stub(helpers, 'destroySession').resolves();
      sandbox.stub(IDM, 'login').resolves({
        body: {
          reset_required: 0,
          reset_guid: 'reset_guid'
        }
      });
      sandbox.stub(signIn, 'auto').resolves();
    });

    experiment('when payload valid and login successful', async () => {
      beforeEach(async () => {
        const request = createRequest({
          payload: {
            email: 'mail@example.com',
            password: 'abcde'
          }
        });
        await controller.postSignin(request, h);
      });

      test('calls IDM.login with the specified email and password', async () => {
        const [email, password] = IDM.login.lastCall.args;
        expect(email).to.equal('mail@example.com');
        expect(password).to.equal('abcde');
      });

      test('destroys existing user session', async () => {
        expect(helpers.destroySession.callCount).to.equal(1);
      });

      test('signs in user', async () => {
        expect(signIn.auto.callCount).to.equal(1);
      });

      test('calls onSignIn handler in plugin options', async () => {
        expect(h.realm.pluginOptions.onSignIn.callCount).to.equal(1);
      });
    });

    experiment('when a password reset is required', async () => {
      beforeEach(async () => {
        IDM.login.resolves({
          body: {
            reset_required: 1,
            reset_guid: 'reset_guid'
          }
        });
        const request = createRequest({
          payload: {
            email: 'mail@example.com',
            password: 'abcde'
          }
        });
        await controller.postSignin(request, h);
      });

      test('redirects to the change password screen', async () => {
        const [path] = h.redirect.lastCall.args;
        expect(path).to.equal('/reset_password_change_password?resetGuid=reset_guid&forced=1');
      });
    });

    experiment('when the payload is not valid', async () => {
      beforeEach(async () => {
        const request = createRequest({
          payload: {
            email: '',
            password: 'abcde'
          }
        });
        await controller.postSignin(request, h);
      });

      test('the form should be rendered again with errors', async () => {
        const [template, view] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/auth/sign-in.njk');
        expect(view.form.errors).to.have.length(2);
      });

      test('values entered in the password field should be cleared', async () => {
        const [, view] = h.view.lastCall.args;
        const password = find(view.form.fields, { name: 'password' });
        expect(password.value).to.equal('');
      });
    });

    experiment('when IDM.login responds with 401 error', async () => {
      beforeEach(async () => {
        IDM.login.rejects({
          statusCode: 401
        });
        const request = createRequest({
          payload: {
            email: 'mail@example.com',
            password: 'abcde'
          }
        });
        await controller.postSignin(request, h);
      });

      test('the form should be rendered again with errors', async () => {
        const [template, view] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/auth/sign-in.njk');
        expect(view.form.errors).to.have.length(2);
      });
    });

    experiment('when IDM.login responds with other errors codes', async () => {
      beforeEach(async () => {
        IDM.login.rejects({
          statusCode: 500
        });
      });

      test('an error is thrown', async () => {
        const request = createRequest({
          payload: {
            email: 'mail@example.com',
            password: 'abcde'
          }
        });
        const func = () => controller.postSignin(request, h);
        expect(func()).to.reject();
      });
    });
  });
});
