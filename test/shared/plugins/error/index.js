'use strict';

const { set } = require('lodash');
const { expect } = require('@hapi/code');
const { beforeEach, experiment, test, afterEach } = exports.lab = require('@hapi/lab').script();
const Boom = require('@hapi/boom');

const sandbox = require('sinon').createSandbox();

const plugin = require('shared/plugins/error');

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
    logOut: sandbox.stub()
  };
};

experiment('shared/plugins/error', () => {
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
      continue: 'continue',
      realm: {
        pluginOptions: {
          logger: {
            info: sandbox.stub(),
            error: sandbox.stub(),
            errorWithJourney: sandbox.stub()
          }
        }
      }
    };
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

    test('returns h.continue if ignore is set in plugin config', async () => {
      const request = createRequest(Boom.forbidden());
      set(request, 'route.settings.plugins.errorPlugin.ignore', true);
      const result = await plugin._handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('calls request.logOut() for CSRF error', async () => {
      const request = createRequest(Boom.forbidden());
      set(request, 'response.data.isCsrfError', true);
      await plugin._handler(request, h);
      expect(request.logOut.callCount).to.equal(1);
      expect(h.realm.pluginOptions.logger.info.callCount).to.equal(1);
    });

    test('logs error and renders 404 page', async () => {
      const request = createRequest(Boom.notFound());
      await plugin._handler(request, h);

      expect(h.view.callCount).to.equal(1);
      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/errors/404');
      expect(view.pageTitle).to.equal('We cannot find that page');
      expect(h.realm.pluginOptions.logger.errorWithJourney.callCount).to.equal(1);
    });

    test('logs error and renders error page for other error types', async () => {
      const request = createRequest(Boom.badImplementation('Test'));
      await plugin._handler(request, h);

      expect(h.view.callCount).to.equal(1);
      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/errors/error');
      expect(view.pageTitle).to.equal('Something went wrong');
      expect(h.realm.pluginOptions.logger.errorWithJourney.callCount).to.equal(1);
    });
  });
});
