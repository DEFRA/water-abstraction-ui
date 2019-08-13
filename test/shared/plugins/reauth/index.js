const Lab = require('@hapi/lab');
const {
  experiment, test, beforeEach, afterEach
} = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const { set } = require('lodash');

const plugin = require('shared/plugins/reauth');
const helpers = require('shared/plugins/reauth/lib/helpers');

experiment('reauth plugin', () => {
  let server, h, request;

  const createRequest = (pluginEnabled = true) => {
    const r = {
      path: '/some/path',
      yar: {
        get: sandbox.stub(),
        set: sandbox.stub()
      }
    };
    set(r, 'route.settings.plugins.reauth', pluginEnabled);
    set(r, 'defra.userId', 123);
    return r;
  };

  const createH = () => {
    const h = {
      realm: {
        pluginOptions: {
          reauthenticate: sandbox.stub()
        }
      },
      continue: 'continue',
      takeover: sandbox.stub()
    };

    h.redirect = sandbox.stub().returns(h);

    return h;
  };

  beforeEach(async () => {
    server = {
      ext: sandbox.stub(),
      route: sandbox.stub()
    };
    sandbox.stub(helpers, 'isExpired');
  });
  afterEach(async () => {
    sandbox.restore();
  });

  test('includes package name and version', async () => {
    expect(plugin.pkg).to.equal({
      name: 'reauthPlugin',
      version: '1.0.0'
    });
  });

  test('has a register function', async () => {
    expect(plugin.register).to.be.a.function();
  });

  test('register function binds the onPreHandler', async () => {
    const options = {
      reauthenticate: sandbox.stub()
    };
    plugin.register(server, options);
    expect(
      server.ext.calledWith({
        type: 'onPreHandler',
        method: plugin._handler
      })
    ).to.equal(true);
  });

  test('register function throws an error if invalid options are supplied', async () => {
    const options = {
      reauthenticate: 'not-a-function'
    };
    const func = () => plugin.register(server, options);
    expect(func).to.throw();
  });

  experiment('when the plugin is disabled on a route', () => {
    beforeEach(async () => {
      request = createRequest(false);
      h = createH();
    });
    test('the expiry time is never checked', async () => {
      await plugin._handler(request, h);
      expect(helpers.isExpired.callCount).to.equal(0);
    });
  });

  experiment('when the plugin is enabled on a route', () => {
    beforeEach(async () => {
      request = createRequest(true);
      h = createH();
    });

    experiment('when the reauthentication has not expired', () => {
      beforeEach(async () => {
        helpers.isExpired.returns(false);
      });

      test('the handler returns h.continue', async () => {
        const result = await plugin._handler(request, h);
        expect(result).to.equal(h.continue);
      });
    });

    experiment('when the reauthentication has expired', () => {
      beforeEach(async () => {
        helpers.isExpired.returns(true);
        await plugin._handler(request, h);
      });

      test('the current request path is stored in the session', async () => {
        expect(request.yar.set.calledWith(
          'reauthRedirectPath', request.path
        )).to.equal(true);
      });

      test('the handler redirects the user an takes over the request', async () => {
        expect(h.redirect.calledWith('/confirm-password')).to.equal(true);
        expect(h.takeover.callCount).to.equal(1);
      });
    });
  });
});
