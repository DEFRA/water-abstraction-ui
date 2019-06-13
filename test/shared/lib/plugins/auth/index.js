const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const plugin = require('../../../../../src/shared/plugins/auth');

experiment('Auth plugin', () => {
  let server, options, h, request;

  const user = {
    user_id: 'user_1'
  };

  beforeEach(async () => {
    server = {
      route: sandbox.stub(),
      ext: sandbox.stub()
    };
    options = {
      signIn: sandbox.stub(),
      onSignIn: sandbox.stub(),
      signOut: sandbox.stub(),
      onSignOut: sandbox.stub()
    };
    h = {
      continue: 'continue'
    };
    request = {};
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the plugin name and version should be set correctly', async () => {
    expect(plugin.name).to.equal('authPlugin');
    expect(plugin.version).to.equal('1.0.0');
  });

  experiment('when plugin is registered', () => {
    beforeEach(async () => {
      plugin.register(server, options);
    });

    test('routes are registered on the server', async () => {
      expect(server.route.callCount).to.equal(1);
      const [routes] = server.route.lastCall.args;
      expect(routes).to.be.an.array();
    });

    test('a pre handler is registered on the server', async () => {
      expect(server.ext.callCount).to.equal(1);
      const [ext] = server.ext.lastCall.args;
      expect(ext.type).to.equal('onPreHandler');
      expect(ext.method).to.be.a.function();
    });

    test('a logIn method is added to each request', async () => {
      const [ext] = server.ext.lastCall.args;
      await ext.method(request, h);
      expect(request.logIn).to.be.a.function();
    });

    test('the request.logIn method calls signIn and onSignIn methods', async () => {
      const [ext] = server.ext.lastCall.args;
      await ext.method(request, h);
      await request.logIn(user);
      expect(options.signIn.calledWith(request, user)).to.equal(true);
      expect(options.onSignIn.calledWith(request, h, user)).to.equal(true);
    });

    test('a logOut method is added to each request', async () => {
      const [ext] = server.ext.lastCall.args;
      await ext.method(request, h);
      expect(request.logOut).to.be.a.function();
    });

    test('the request.logOut method calls signOut and onSignOut methods', async () => {
      const [ext] = server.ext.lastCall.args;
      await ext.method(request, h);
      await request.logOut();
      expect(options.signOut.calledWith(request, h)).to.equal(true);
      expect(options.onSignOut.calledWith(request, h)).to.equal(true);
    });
  });
});
