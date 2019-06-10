const sinon = require('sinon');
const { expect } = require('code');
const { logger } = require('internal/logger');
const { experiment, test, afterEach, beforeEach } = exports.lab = require('lab').script();
const loginHelpers = require('internal/lib/login-helpers');
const { scope } = require('internal/lib/constants');

const sandbox = sinon.createSandbox();

const userId = 'user_1';

experiment('loginHelpers', () => {
  let h;

  const getRequest = (scope = []) => {
    return {
      path: '/request-path',
      auth: {
        credentials: {
          userId,
          scope
        }
      },
      cookieAuth: {
        set: sandbox.stub()
      },
      yar: {
        set: sandbox.stub()
      }
    };
  };

  beforeEach(async () => {
    h = {
      redirect: sandbox.stub().returns({
        takeover: sandbox.stub()
      }),
      continue: 'continue'
    };
    sandbox.stub(logger, 'info');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('preRedirectIfAuthenticated', () => {
    test('returns h.continue if the request is not authenticated', async () => {
      const request = getRequest();
      delete request.auth.credentials.userId;
      const result = await loginHelpers.preRedirectIfAuthenticated(request, h);
      expect(result).to.equal(h.continue);
    });

    test('returns h.redirect if request is authenticated', async () => {
      const request = getRequest(scope.external);
      await loginHelpers.preRedirectIfAuthenticated(request, h);
      const [ path ] = h.redirect.lastCall.args;
      expect(path).to.equal('/licences');
    });

    test('logs a message if a redirect has taken place', async () => {
      const request = getRequest(scope.external);
      await loginHelpers.preRedirectIfAuthenticated(request, h);
      const [ message, params ] = logger.info.lastCall.args;
      expect(message).to.be.a.string();
      expect(params.from).to.equal(request.path);
      expect(params.path).to.equal('/licences');
    });
  });
});
