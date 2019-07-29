const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const { set } = require('lodash');
const sandbox = require('sinon').createSandbox();
const controller = require('shared/plugins/auth/controller');

const createRequest = (isAuthenticated) => {
  return {
    logIn: sandbox.stub(),
    logOut: sandbox.stub(),
    auth: {
      credentials: {
        userId: isAuthenticated ? 'user_1' : undefined
      }
    },
    query: {},
    view: { csrfToken: 'token' },
    payload: {
      csrf_token: 'token',
      email: 'bob@example.com',
      password: 'topsecret'
    }
  };
};

experiment('Auth plugin controller', () => {
  let h;

  beforeEach(async () => {
    const authConfig = {
      ifAuthenticated: sandbox.stub(),
      signOut: sandbox.stub(),
      authenticate: sandbox.stub()
    };

    h = {
      view: sandbox.stub(),
      realm: {
        pluginOptions: authConfig
      },
      redirect: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.reset();
  });

  experiment('getSignin', () => {
    test('calls ifAuthenticated method in auth config when user is authenticated', async () => {
      const request = createRequest(true);
      await controller.getSignin(request, h);
      expect(h.realm.pluginOptions.ifAuthenticated.callCount).to.equal(1);
    });

    experiment('when user is not authenticated', () => {
      let request;

      beforeEach(async () => {
        request = createRequest(false);
        await controller.getSignin(request, h);
      });

      test('the correct template is used', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/auth/sign-in.njk');
      });

      test('the correct data is output to the view', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.pageTitle).to.equal('Sign in');
        expect(view.showResetMessage).to.equal(false);
        expect(view.form).to.be.an.object();
      });

      test('if a query param is present in the request, sets a showResetMessage flag in the view', async () => {
        set(request, 'query.flash', 'password-reset');
        await controller.getSignin(request, h);
        const [, view] = h.view.lastCall.args;
        expect(view.showResetMessage).to.equal(true);
      });

      test('if a form object is provided as an argument, this is output to the view', async () => {
        await controller.getSignin(request, h, { foo: 'bar' });
        const [, view] = h.view.lastCall.args;
        expect(view.form).to.equal({ foo: 'bar' });
      });
    });
  });

  experiment('getSignedOut', () => {
    test('calls the logOut method on the request', async () => {
      const request = createRequest();
      await controller.getSignout(request, h);
      expect(request.logOut.callCount).to.equal(1);
    });
  });

  experiment('getSignedOut', () => {
    experiment('for an anonymous user type', async () => {
      beforeEach(async () => {
        const request = createRequest();
        await controller.getSignedOut(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/auth/signed-out.njk');
      });

      test('outputs correct data to the view', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.surveyType).to.equal('anonymous');
        expect(view.pageTitle).to.equal('You are signed out');
      });
    });

    test('sets an external survey type if query param set', async () => {
      const request = createRequest();
      set(request, 'query.u', 'e');
      await controller.getSignedOut(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.surveyType).to.equal('external');
    });

    test('sets an internal survey type if query param set', async () => {
      const request = createRequest();
      set(request, 'query.u', 'i');
      await controller.getSignedOut(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.surveyType).to.equal('internal');
    });
  });

  experiment('postSignin', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
    });

    test('calls signOut method in the authConfig', async () => {
      await controller.postSignin(request, h);
      expect(h.realm.pluginOptions.signOut.callCount).to.equal(1);
    });

    experiment('when payload is valid', async () => {
      test('the authenticate method is called', async () => {
        await controller.postSignin(request, h);
        const { email, password } = request.payload;
        expect(h.realm.pluginOptions.authenticate.calledWith(email, password)).to.equal(true);
      });

      test('the user is redirected to password reset if flag set in the IDM response', async () => {
        h.realm.pluginOptions.authenticate.resolves({
          reset_required: '1',
          reset_guid: 'reset_guid'
        });
        await controller.postSignin(request, h);
        expect(h.redirect.calledWith('/reset_password_change_password?resetGuid=reset_guid&forced=1')).to.equal(true);
      });

      test('the user is logged in if a valid user returned in the IDM response', async () => {
        const user = {
          user_id: 'user_1',
          user_name: 'bob@example.com',
          reset_required: '0'
        };
        h.realm.pluginOptions.authenticate.resolves(user);
        await controller.postSignin(request, h);
        expect(request.logIn.calledWith(user)).to.equal(true);
      });

      test('the form is displayed again in error state if a user is nor returned in IDM response', async () => {
        h.realm.pluginOptions.authenticate.resolves();
        await controller.postSignin(request, h);
        const [template, view] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/auth/sign-in.njk');
        expect(view.form.errors).to.have.length(2);
      });
    });

    experiment('when payload is invalid', async () => {
      beforeEach(async () => {
        request = createRequest();
        request.payload.email = 'not_an_email';
        await controller.postSignin(request, h);
      });

      test('re-renders the form in error state', async () => {
        const [template, view] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/auth/sign-in.njk');
        expect(view.form.errors).to.have.length(1);
      });
    });
  });
});
