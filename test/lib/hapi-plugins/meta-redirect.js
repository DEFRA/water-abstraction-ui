const { expect } = require('code');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const metaRedirectPlugin = require('../../../src/lib/hapi-plugins/meta-redirect');
const { set } = require('lodash');

experiment('meta redirect plugin', () => {
  let server;

  beforeEach(async () => {
    server = {
      decorate: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has a register function', async () => {
    expect(metaRedirectPlugin.register).to.be.a.function();
  });

  test('the register function decorates the HAPI toolkit with a metaRedirect method', async () => {
    await metaRedirectPlugin.register(server);
    const [type, method, func] = server.decorate.lastCall.args;
    expect(type).to.equal('toolkit');
    expect(method).to.equal('metaRedirect');
    expect(func).to.equal(metaRedirectPlugin._metaRedirect);
  });

  test('has pkg information object', async () => {
    expect(metaRedirectPlugin.pkg).to.equal({
      name: 'metaRedirectPlugin',
      version: '1.0.0'
    });
  });

  experiment('_metaRedirect', () => {
    test('it outputs a meta tag to redirect the user', async () => {
      const context = {
        response: sandbox.stub()
      };
      set(context, 'request.plugins.blankie.nonces.script', 'nonce-value');
      metaRedirectPlugin._metaRedirect.apply(context, ['/some/path']);

      const [ html ] = context.response.lastCall.args;

      expect(html).to.contain('<meta http-equiv="refresh" content="0; url="/some/path" />');
      expect(html).to.contain(`<script nonce=nonce-value>location.href='/some/path';</script>`);
    });
  });
});
