const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const plugin = require('shared/plugins/cookie-message');

const createRequest = seenCookieMessage => {
  return {
    state: {
      seen_cookie_message: seenCookieMessage
    }
  };
};

const h = {
  state: sandbox.stub(),
  continue: sandbox.stub()
};

experiment('plugins/cookie-message/index', () => {
  let server;
  beforeEach(async () => {
    server = {
      ext: sandbox.stub()
    };
  });
  afterEach(async () => {
    sandbox.restore();
  });

  test('includes package name and version', async () => {
    expect(plugin.pkg).to.equal({
      name: 'cookieMessagePlugin',
      version: '1.0.0'
    });
  });

  test('has a register function', async () => {
    expect(plugin.register).to.be.a.function();
  });

  test('register function binds the onPreHandler', async () => {
    plugin.register(server, {});
    expect(
      server.ext.calledWith({
        type: 'onPreHandler',
        method: plugin._handler
      })
    ).to.equal(true);
  });

  experiment('._handler', () => {
    let request;

    experiment('when seen_cookie_message is "yes"', () => {
      beforeEach(async () => {
        request = createRequest('yes');
        plugin._handler(request, h);
      });

      test('sets the flag to false in request.view', async () => {
        expect(request.view.isCookieBannerVisible).to.be.false();
      });

      test('returns h.continue', async () => {
        const request = createRequest('yxes');
        const response = await plugin._handler(request, h);
        expect(response).to.equal(h.continue);
      });
    });

    experiment('when seen_cookie_message is not "yes"', () => {
      beforeEach(async () => {
        request = createRequest();
        plugin._handler(request, h);
      });

      test('sets the flag to true in request.view', async () => {
        expect(request.view.isCookieBannerVisible).to.be.true();
      });

      test('returns h.continue', async () => {
        const request = createRequest('yxes');
        const response = await plugin._handler(request, h);
        expect(response).to.equal(h.continue);
      });
    });
  });
});
