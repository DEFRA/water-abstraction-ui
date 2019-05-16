const sinon = require('sinon');
const { set } = require('lodash');
const { expect } = require('code');
const { beforeEach, experiment, test, afterEach } = exports.lab = require('lab').script();
const Boom = require('boom');

const sandbox = sinon.createSandbox();

const plugin = require('../../../../src/external/lib/hapi-plugins/error');
const { logger } = require('../../../../src/external/logger');

const createRequest = (error = {}) => {
  return {
    auth: {
      credentials: {

      }
    },
    url: {
      path: '/some/path'
    },
    response: error,
    sessionStore: {
      get: sandbox.stub(),
      destroy: sandbox.stub()
    },
    cookieAuth: {
      clear: sandbox.stub()
    }
  };
};

experiment('errors plugin', () => {
  let server, h, code;

  beforeEach(async () => {
    code = sandbox.stub();
    server = {
      ext: sandbox.stub()
    };
    h = {
      redirect: sandbox.stub(),
      view: sandbox.stub().returns({
        code
      }),
      continue: 'continue'
    };
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('registers plugin correctly', () => {
    test('defines package name and version', async () => {
      expect(plugin.pkg.name).to.equal('errorPlugin');
      expect(plugin.pkg.version).to.be.a.string();
    });

    test('defines a register function', async () => {
      plugin.register(server);
      const [{ type, method }] = server.ext.lastCall.args;
      expect(type).to.equal('onPreResponse');
      expect(method).to.equal(plugin._handler);
    });
  });

  experiment('handler', () => {
    test('returns h.continue if there is no error', async () => {
      const request = createRequest();
      const result = await plugin._handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('returns h.continue for 404 not found', async () => {
      const request = createRequest(Boom.notFound());
      const result = await plugin._handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('returns h.continue if ignore is set in plugin config', async () => {
      const request = createRequest(Boom.forbidden());
      set(request, 'route.settings.plugins.errorPlugin.ignore', true);
      const result = await plugin._handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('logs and redirects to welcome for 401 unauthorized', async () => {
      const request = createRequest(Boom.unauthorized());
      await plugin._handler(request, h);
      expect(logger.info.callCount).to.equal(1);
      const [ path ] = h.redirect.lastCall.args;
      expect(path).to.equal('/welcome');
    });

    test('logs redirects to welcome for 403 forbidden', async () => {
      const request = createRequest(Boom.forbidden());
      await plugin._handler(request, h);
      expect(logger.info.callCount).to.equal(1);
      const [ path ] = h.redirect.lastCall.args;
      expect(path).to.equal('/welcome');
    });

    test('redirects to /signout for CSRF error and destroys cookie/session', async () => {
      const request = createRequest(Boom.forbidden());
      set(request, 'response.data.isCsrfError', true);
      await plugin._handler(request, h);
      expect(logger.info.callCount).to.equal(1);
      const [ path ] = h.redirect.lastCall.args;
      expect(path).to.equal('/signout');
      expect(request.sessionStore.destroy.callCount).to.equal(1);
      expect(request.cookieAuth.clear.callCount).to.equal(1);
    });

    test('logs error and renders error page for other error types', async () => {
      const request = createRequest(Boom.badImplementation('Test'));
      await plugin._handler(request, h);

      expect(h.view.callCount).to.equal(1);
      const [ template ] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/errors/error.njk');
      expect(logger.error.callCount).to.equal(1);
    });
  });
});
