const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();

const NotificationsApiClient = require('shared/lib/connectors/services/water/NotificationsApiClient');

experiment('shared/services/water/NotificationsApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {};
    config = {
      services: {
        water: 'https://example.com/water'
      },
      jwt: {
        token: 'test-jwt-token'
      }
    };
    client = new NotificationsApiClient(config, logger);

    sandbox.stub(client, 'findMany').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/water/notification');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/water');
    });
  });

  experiment('.getLatestEmailByAddress', () => {
    test('calls client.findMany with correct filter', async () => {
      await client.getLatestEmailByAddress('user@example.com');
      const [filter] = client.findMany.lastCall.args;
      expect(filter).to.equal({
        recipient: 'user@example.com',
        message_type: 'email'
      });
    });

    test('calls client.findMany with correct sort', async () => {
      await client.getLatestEmailByAddress('user@example.com');
      const [, sort] = client.findMany.lastCall.args;
      expect(sort).to.equal({ send_after: -1 });
    });

    test('calls client.findMany with correct sort', async () => {
      await client.getLatestEmailByAddress('user@example.com');
      const [, , pagination] = client.findMany.lastCall.args;
      expect(pagination).to.equal({ page: 1, perPage: 1 });
    });
  });
});
