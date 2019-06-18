const KpiApiClient = require('shared/lib/connectors/services/idm/KpiApiClient');

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('lab').script();
const { expect } = require('code');

experiment('KpiApiClient', () => {
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
        idm: 'https://example.com/idm'
      }
    };

    client = new KpiApiClient(config, logger);
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/idm/kpi');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/idm');
    });
  });
});
