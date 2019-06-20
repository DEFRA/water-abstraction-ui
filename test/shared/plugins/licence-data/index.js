const { experiment, test, beforeEach, afterEach, fail } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const plugin = require('shared/plugins/licence-data');
const { set } = require('lodash');

experiment('Licence data plugin', () => {
  let server, h;

  beforeEach(async () => {
    server = {
      ext: sandbox.stub()
    };
    h = {
      continue: 'continue',
      realm: {
        pluginOptions: {
          getSummaryByDocumentId: sandbox.stub(),
          getCommunicationsByDocumentId: sandbox.stub()
        }
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('includes package details', async () => {
    expect(plugin.pkg).to.equal({
      name: 'licenceDataPlugin',
      version: '1.0.0'
    });
  });

  experiment('register method', () => {
    test('should be a function', async () => {
      expect(plugin.register).to.be.a.function();
    });

    test('registers an onPreHandler', async () => {
      await plugin.register(server);
      expect(server.ext.calledWith({
        type: 'onPreHandler',
        method: plugin._onPreHandler
      })).to.equal(true);
    });
  });

  experiment('onPreHandler', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          documentId: 'document_1'
        },
        auth: {
          credentials: {
            userId: 'user_1'
          }
        },
        log: sandbox.stub(),
        route: {
          settings: {
            plugins: {

            }
          }
        }
      };
    });

    test('returns h.continue if plugin config not set on route', async () => {
      const result = await plugin._onPreHandler(request, h);
      expect(result).to.equal(h.continue);
    });

    experiment('when summary data requested in route config', () => {
      beforeEach(async () => {
        set(request, 'route.settings.plugins.licenceData', {
          load: {
            summary: true
          }
        });
      });

      test('loads data using getSummaryByDocumentId', async () => {
        await plugin._onPreHandler(request, h);

        expect(h.realm.pluginOptions.getSummaryByDocumentId.calledWith(
          request.params.documentId, request
        )).to.equal(true);
      });

      test('returns h.continue', async () => {
        const result = await plugin._onPreHandler(request, h);
        expect(result).to.equal(h.continue);
      });

      test('throws a Boom error and logs if getter throws error', async () => {
        h.realm.pluginOptions.getSummaryByDocumentId.rejects();

        try {
          await plugin._onPreHandler(request, h);
          fail();
        } catch (err) {
          expect(err.isBoom).to.equal(true);
          expect(err.output.statusCode).to.equal(500);
          expect(request.log.calledWith('error', 'Error getting licence data', {
            load: request.load,
            documentId: request.params.documentId,
            credentials: request.auth.credentials
          })).to.equal(true);
        }
      });
    });

    experiment('when communications data requested in route config', () => {
      beforeEach(async () => {
        set(request, 'route.settings.plugins.licenceData', {
          load: {
            communications: true
          }
        });
      });

      test('loads data using getCommunicationsByDocumentId', async () => {
        await plugin._onPreHandler(request, h);

        expect(h.realm.pluginOptions.getCommunicationsByDocumentId.calledWith(
          request.params.documentId, request
        )).to.equal(true);
      });
    });

    experiment('when route config is invalid', () => {
      beforeEach(async () => {
        set(request, 'route.settings.plugins.licenceData', {
          load: {
            unknownOption: true
          }
        });
      });

      test('throws an error when onPreHandler is called', async () => {
        try {
          await plugin._onPreHandler(request, h);
          fail();
        } catch (err) {
          expect(err.name).to.equal('ValidationError');
        }
      });
    });
  });
});
