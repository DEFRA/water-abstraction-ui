const AbstractionReformAnalysisApiClient = require('internal/lib/connectors/services/water/AbstractionReformAnalysisApiClient');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('internal/services/AbstractionReformAnalysisApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {};
    config = {
      jwt: {
        token: 'test-jwt-token'
      },
      services: {
        water: 'https://example.com/water'
      }
    };

    client = new AbstractionReformAnalysisApiClient(config, logger);

    sandbox.stub(serviceRequest, 'post').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/water/ar/licences');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/water');
    });
  });

  experiment('.arRefreshLicenceWebhook', () => {
    test('makes a post to the expected URL', async () => {
      await client.arRefreshLicenceWebhook('test-lic-id');
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal('https://example.com/water/ar/test-lic-id');
    });
  });
});
