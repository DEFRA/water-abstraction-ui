const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const sessionsPlugin = require('../../../../src/internal/lib/hapi-plugins/sessions');
const SessionStore = require('../../../../src/internal/lib/session-store');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const getRequest = (isAuthenticated = true) => ({
  auth: {
    isAuthenticated,
    strategy: 'standard'
  },
  cookieAuth: {
    clear: sandbox.spy()
  },
  sessionStore: {
    save: sandbox.spy()
  }
});

experiment('sessions', () => {
  let h;
  let onPreHandler;
  let takeover;
  let onPostHandler;

  const server = {
    ext: sandbox.stub()
  };

  beforeEach(async () => {
    sandbox.stub(SessionStore.prototype, 'load').resolves(true);

    takeover = sandbox.spy();

    h = {
      continue: 'continue',
      redirect: sandbox.stub().returns({
        takeover
      })
    };

    sessionsPlugin.register(server);

    onPreHandler = server.ext.firstCall.args[0].method;
    onPostHandler = server.ext.lastCall.args[0].method;
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('onPreHandler', () => {
    test('returns continue if no session is required', async () => {
      const request = getRequest(false);
      const result = await onPreHandler(request, h);
      expect(result).to.equal('continue');
    });

    experiment('when the session is required', () => {
      let request;
      let response;

      beforeEach(async () => {
        request = getRequest();
        response = await onPreHandler(request, h);
      });

      test('the session is loaded', async () => {
        expect(SessionStore.prototype.load.called).to.be.true();
      });

      test('responds with continue', async () => {
        expect(response).to.equal('continue');
      });
    });

    experiment('when the session does not load', () => {
      let request;

      beforeEach(async () => {
        request = getRequest();

        SessionStore.prototype.load.rejects({
          name: 'NotFoundError'
        });

        await onPreHandler(request, h);
      });

      test('the cookie is cleared', async () => {
        expect(request.cookieAuth.clear.called).to.be.true();
      });

      test('the user is redirected to the welcome page', async () => {
        expect(h.redirect.calledWith('/welcome')).to.be.true();
        expect(takeover.called).to.be.true();
      });
    });
  });

  experiment('onPostHandler', () => {
    let request;
    let response;

    beforeEach(async () => {
      request = getRequest();
      response = await onPostHandler(request, h);
    });

    test('saves the session', async () => {
      expect(request.sessionStore.save.called).to.be.true();
    });

    test('responds with continue', async () => {
      expect(response).to.equal('continue');
    });
  });
});
