const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const AuthConfig = require('internal/lib/AuthConfig');
const { logger } = require('internal/logger');

const config = { idm: { application: 'water_test' } };

const request = {
  response: {
    error: 'bad-error',
    message: 'very bad error occurred',
    statusCode: 500,
    stack: 'test error stack'
  }
};

experiment('internal/lib/AuthConfig', async () => {
  let h, authConfig;

  beforeEach(async () => {
    authConfig = new AuthConfig(config);

    h = {
      metaRedirect: sandbox.stub(),
      redirect: sandbox.stub()
    };

    sandbox.stub(logger, 'info');
  });

  afterEach(async () => sandbox.restore());

  experiment('.ifAuthenticated', () => {
    test('calls h.metaRedirect with expected path', () => {
      authConfig.ifAuthenticated(request, h);
      expect(h.metaRedirect.calledWith('/licences')).to.be.true();
    });
  });

  experiment('.onSignIn', () => {
    test('calls h.metaRedirect with expected path', () => {
      const user = { user_id: 25, user_name: 'test@example.com' };
      authConfig.onSignIn(request, h, user);
      expect(h.metaRedirect.calledWith('/licences')).to.be.true();
    });
  });

  experiment('.onSignOut', () => {
    test('calls h.metaRedirect with expected path', () => {
      authConfig.onSignOut(request, h);
      expect(h.metaRedirect.calledWith('/signed-out?u=i')).to.be.true();
    });
  });

  experiment('.onUnauthorized', () => {
    test('logs error and calls h.redirect with expected path', () => {
      authConfig.onUnauthorized(request, h);

      expect(logger.info.calledWith(request.response)).to.be.true();
      expect(h.redirect.calledWith('/signin')).to.be.true();
    });
  });
});
