const sinon = require('sinon');
const { expect } = require('@hapi/code');
const { beforeEach, experiment, test, afterEach } = exports.lab = require('@hapi/lab').script();
const Boom = require('@hapi/boom');

const sandbox = sinon.createSandbox();

const plugin = require('shared/plugins/auth');

const createRequest = (error = {}) => {
  return {
    auth: {
      credentials: {}
    },
    url: {
      path: '/some/path'
    },
    response: error,
    yar: {
      get: sandbox.stub(),
      reset: sandbox.stub()
    },
    cookieAuth: {
      clear: sandbox.stub()
    },
    state: {
      seen_cookie_message: 'yes'
    },
    handleUnauthorized: sandbox.stub().returns()
  };
};

experiment('auth pluging', () => {
  let server, h;

  beforeEach(async () => {
    server = {
      ext: sandbox.stub(),
      route: sandbox.stub()
    };
    h = {
      continue: sandbox.stub()
    };
  });

  afterEach(async () => { sandbox.restore(); });

  experiment('registers plugin correctly', () => {
    test('defines package name and version', async () => {
      expect(plugin.name).to.equal('authPlugin');
      expect(plugin.version).to.be.a.string();
    });

    test('defines a register function with a preHandler', async () => {
      plugin.register(server);
      const [{ type, method }] = server.ext.lastCall.args;
      expect(type).to.equal('onPreHandler');
      expect(method).to.be.a.function();
    });

    test('defines a register function with a preHandler', async () => {
      plugin.register(server);
      const [, { type, method }] = server.ext.lastCall.args;
      expect(type).to.equal('onPreResponse');
      expect(method).to.be.a.function();
    });
  });

  experiment('preResponseHandler', () => {
    test('logs error and calls request.handleUnauthorized for 401 unauthorized', async () => {
      const request = createRequest(Boom.unauthorized());
      await plugin._preResponseHandler(request, h);
      const [passedRequest] = request.handleUnauthorized.lastCall.args;
      expect(passedRequest).to.equal(request);
    });

    test('logs error and calls request.handleUnauthorized for 403 forbidden', async () => {
      const request = createRequest(Boom.forbidden());
      await plugin._preResponseHandler(request, h);
      const [passedRequest] = request.handleUnauthorized.lastCall.args;
      expect(passedRequest).to.equal(request);
    });
  });
});
