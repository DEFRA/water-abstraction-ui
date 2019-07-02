const LookupsApiClient = require('internal/lib/connectors/services/water/LookupsApiClient');

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('lab').script();
const { expect } = require('code');

experiment('internal/services/LookupsApiClient', () => {
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

    client = new LookupsApiClient(config, logger);
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/water/lookup');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/water');
    });
  });
});
