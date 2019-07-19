const { set } = require('lodash');
const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const plugin = require('external/lib/hapi-plugins/company-selection');
const handler = plugin._handler;

const getTestRequest = (overrides = {}) => {
  const defaults = Object.assign({
    method: 'get',
    isAuthenticated: true,
    companyId: undefined,
    companyCount: 1,
    path: '/test'
  }, overrides);

  const request = {
    path: defaults.path,
    method: defaults.method
  };

  if (defaults.isAuthenticated) {
    set(request, 'defra.companyId', defaults.companyId);
    set(request, 'defra.companyCount', defaults.companyCount);
  }

  set(request, 'auth.isAuthenticated', defaults.isAuthenticated);
  set(request, 'route.settings.auth.access', defaults.access);
  set(request, 'auth.credentials.scope', ['external']);

  return request;
};

experiment('plugin', async () => {
  test('is configured correctly', async () => {
    expect(plugin.pkg.name).to.equal('companySelection');
    expect(plugin.pkg.version).to.equal('2.0.0');
  });

  test('defines a dependency on authPlugin', async () => {
    expect(plugin.dependencies).to.contain('authPlugin');
  });

  test('registers an onPreResponse handler', async () => {
    const server = {
      ext: sinon.stub()
    };
    plugin.register(server);
    expect(server.ext.callCount).to.equal(1);
    const { method, type } = server.ext.lastCall.args[0];
    expect(type).to.equal('onPreResponse');
    expect(method).to.equal(plugin._handler);
  });
});

experiment('handler', () => {
  let h;

  beforeEach(async () => {
    h = {
      redirect: sinon.stub().returns({
        takeover: () => 'takeover'
      }),
      continue: 'CONTINUE' };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('continues if the request is not authenticated', async () => {
    const request = getTestRequest({
      isAuthenticated: false
    });

    const result = handler(request, h);
    expect(result).to.equal(h.continue);
  });

  experiment('external user', () => {
    test('does not redirect for POST requests', async () => {
      const request = getTestRequest({ method: 'POST' });
      const result = handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('does not redirect when there is a company id', async () => {
      const request = getTestRequest({
        companyId: 'test-id'
      });
      const result = handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('does not redirect when the select-company page is requested', async () => {
      const request = getTestRequest({
        path: '/select-company'
      });
      const result = handler(request, h);
      expect(result).to.equal(h.continue);
    });
  });

  experiment('external user with no selected company', () => {
    test('is redirected to "add licences" if they have no companies', async () => {
      const request = getTestRequest({
        companyCount: 0,
        access: [{}]
      });

      const result = handler(request, h);
      const [redirectPath] = h.redirect.lastCall.args;
      expect(result).to.equal('takeover');
      expect(redirectPath).to.equal('/add-licences');
    });

    test('is redirected to "select company" if they have companies', async () => {
      const request = getTestRequest({
        companyCount: 1,
        access: [{}]
      });

      const result = handler(request, h);
      const [redirectPath] = h.redirect.lastCall.args;
      expect(result).to.equal('takeover');
      expect(redirectPath).to.equal('/select-company');
    });

    test('is not redirected when method is POST', async () => {
      const request = getTestRequest({
        method: 'post',
        companyCount: 0,
        access: [{}]
      });
      const result = handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('is not redirected when route is not authenticated', async () => {
      const request = getTestRequest({
        isAuthenticated: false,
        companyCount: 0,
        access: [{}]
      });
      const result = handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('is not redirected when route has no access configuration', async () => {
      const request = getTestRequest({
        isAuthenticated: false,
        companyCount: 0,
        access: undefined
      });
      const result = handler(request, h);
      expect(result).to.equal(h.continue);
    });
  });
});
