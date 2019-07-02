const LinesApiClient = require('shared/lib/connectors/services/returns/LinesApiClient');

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('lab').script();
const { expect } = require('code');

experiment('shared/services/LinesApiClient', () => {
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
        returns: 'https://example.com/returns'
      }
    };

    client = new LinesApiClient(config, logger);
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/returns/lines');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/returns');
    });
  });
});
