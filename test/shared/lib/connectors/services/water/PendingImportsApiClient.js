const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const PendingImportsApiClient = require('shared/lib/connectors/services/water/PendingImportsApiClient');

experiment('shared/services/water/PendingImportsApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {
      error: () => {}
    };
    config = {
      services: {
        water: 'https://example.com/water'
      },
      jwt: {
        token: 'test-jwt-token'
      }
    };
    client = new PendingImportsApiClient(config, logger);
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/water/pending_import');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/water');
    });
  });
});
