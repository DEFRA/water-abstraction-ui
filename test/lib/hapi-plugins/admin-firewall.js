const sinon = require('sinon');
const { set } = require('lodash');
const { expect } = require('code');
const { beforeEach, experiment, test, afterEach } = exports.lab = require('lab').script();
const Boom = require('boom');

const sandbox = sinon.createSandbox();

const plugin = require('../../../src/lib/hapi-plugins/admin-firewall');
const { scope } = require('../../../src/lib/constants');

const createRequest = (path, scope) => {
  const req = {
    url: {
      path
    },
    auth: {
      credentials: {

      }
    }
  };
  if (scope) {
    set(req, 'auth.credentials.scope', scope);
    set(req, 'route.settings.auth.access', {
      entity: undefined,
      scope: { selection: [] }
    });
  }
  return req;
};

experiment('admin firewall plugin', () => {
  let server, h;

  beforeEach(async () => {
    server = {
      ext: sandbox.stub()
    };
    h = {
      continue: 'continue'
    };
    sandbox.stub(Boom, 'unauthorized');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('registers plugin correctly', () => {
    test('defines package name and version', async () => {
      expect(plugin.pkg.name).to.equal('adminFirewall');
      expect(plugin.pkg.version).to.be.a.string();
    });

    test('defines a register function', async () => {
      plugin.register(server);
      const [{ type, method }] = server.ext.lastCall.args;
      expect(type).to.equal('onPreHandler');
      expect(method).to.equal(plugin._handler);
    });
  });

  experiment('handler', () => {
    test('returns h.continue if the requested URL is not in /admin', async () => {
      const request = createRequest();
      const result = await plugin._handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('throws a Boom unauthorized error if admin URL and user has external scope', async () => {
      const request = createRequest('/admin', scope.external);
      const func = () => plugin._handler(request, h);
      await expect(func()).to.reject();
      expect(Boom.unauthorized.callCount).to.equal(1);
    });

    test('returns h.continue if admin URL and user has internal scope', async () => {
      const request = createRequest('/admin', scope.internal);
      const result = await plugin._handler(request, h);
      expect(result).to.equal(h.continue);
    });
  });
});
