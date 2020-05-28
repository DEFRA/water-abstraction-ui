'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const controller = require('../../../../src/shared/plugins/service-status/controller');
const fileCheck = require('../../../../src/shared/lib/file-check');
const Catbox = require('@hapi/catbox');

experiment('shared/plugins/service-status/controller', () => {
  let cache;

  beforeEach(async () => {
    sandbox.stub(fileCheck, 'virusCheck').resolves(true);

    cache = {
      start: sandbox.stub().resolves(),
      set: sandbox.stub().resolves(),
      get: sandbox.stub().resolves(true)
    };

    sandbox.stub(Catbox, 'Client').returns(cache);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getServiceStatus', () => {
    let request;
    let h;

    beforeEach(async () => {
      h = {
        view: sandbox.spy(),
        realm: {
          pluginOptions: {
            logger: {
              error: sandbox.spy()
            },
            redis: {
              host: 'test-host',
              port: 1234
            },
            services: {
              water: {
                serviceStatus: {
                  getServiceStatus: async () => ({
                    data: {
                      testing: true
                    }
                  })
                }
              }
            }
          }
        }
      };
      request = {
        query: {}
      };
    });

    experiment('the cache is tested', () => {
      test('a new cache is created', async () => {
        await controller.getServiceStatus(request, h);
        const [, options] = Catbox.Client.lastCall.args;
        expect(options).to.equal({
          host: 'test-host',
          port: 1234,
          db: 0
        });
      });

      test('a new cache is created using a password if supplied', async () => {
        h.realm.pluginOptions.redis.password = 'sshhhh';

        await controller.getServiceStatus(request, h);
        const [, options] = Catbox.Client.lastCall.args;
        expect(options).to.equal({
          host: 'test-host',
          port: 1234,
          password: 'sshhhh',
          db: 0
        });
      });

      test('returns "Not connected" if the cache will not start', async () => {
        cache.start.rejects();
        await controller.getServiceStatus(request, h);

        const [, status] = h.view.lastCall.args;
        expect(status.cacheConnection).to.equal('Not connected');
      });

      test('returns "Not connected" if the cache will not set a value', async () => {
        cache.set.rejects();
        await controller.getServiceStatus(request, h);

        const [, status] = h.view.lastCall.args;
        expect(status.cacheConnection).to.equal('Not connected');
      });

      test('returns "Not connected" if the cache will not get a value', async () => {
        cache.get.rejects();
        await controller.getServiceStatus(request, h);

        const [, status] = h.view.lastCall.args;
        expect(status.cacheConnection).to.equal('Not connected');
      });

      test('returns "Connected" if the cache will get and set value', async () => {
        await controller.getServiceStatus(request, h);

        const [, status] = h.view.lastCall.args;
        expect(status.cacheConnection).to.equal('Connected');
      });
    });

    experiment('when requesting the status page', () => {
      beforeEach(async () => {
        await controller.getServiceStatus(request, h);
      });

      test('the expected view is used', async () => {
        const [view] = h.view.lastCall.args;
        expect(view).to.equal('nunjucks/service-status/index');
      });

      test('the service status object is passed to the view', async () => {
        const [, status] = h.view.lastCall.args;

        expect(status).to.equal({
          cacheConnection: 'Connected',
          testing: true,
          virusScanner: 'ERROR'
        });
      });
    });

    experiment('when the request for JSON is made', () => {
      test('the service status is returned', async () => {
        request.query = { format: 'json' };

        const status = await controller.getServiceStatus(request, h);

        expect(status).to.equal({
          cacheConnection: 'Connected',
          testing: true,
          virusScanner: 'ERROR'
        });
      });
    });
  });
});
