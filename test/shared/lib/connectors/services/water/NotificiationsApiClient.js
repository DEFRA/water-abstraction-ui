const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const NotificationsApiClient = require('shared/lib/connectors/services/water/NotificationsApiClient');

experiment('shared/services/water/NotificationsApiClient', () => {
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
    client = new NotificationsApiClient(config, logger);

    sandbox.stub(client, 'findMany').resolves();
    sandbox.stub(serviceRequest, 'post').resolves();
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

  experiment('sendNotifyMessage', () => {
    let recipient;
    let personalisation;

    beforeEach(async () => {
      recipient = { to: 'test@example.com' };
      personalisation = { address: 'test-address' };
    });

    test('uses the expected url', async () => {
      await client.sendNotifyMessage('test-ref', recipient, personalisation);
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(`${config.services.water}/notify/test-ref`);
    });

    test('passes the expected body', async () => {
      await client.sendNotifyMessage('test-ref', recipient, personalisation);
      const [, body] = serviceRequest.post.lastCall.args;
      expect(body).to.equal({
        body: {
          recipient: {
            to: 'test@example.com'
          },
          personalisation: {
            address: 'test-address'
          }
        }
      });
    });

    test('returns the response body on success', async () => {
      serviceRequest.post.resolves({
        body: 'body-content'
      });

      const data = await client.sendNotifyMessage('test-ref', recipient, personalisation);

      expect(data).to.equal('body-content');
    });

    test('returns the response body on failure', async () => {
      serviceRequest.post.rejects({
        error: 'bad news'
      });

      const response = await client.sendNotifyMessage('test-ref', recipient, personalisation);

      expect(response).to.equal({ error: 'bad news' });
    });
  });
});
