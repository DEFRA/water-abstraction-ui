const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const NotificationsApiClient = require('internal/lib/connectors/services/water/NotificationsApiClient');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('internal/NotificationsApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {
      error: sandbox.spy()
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

    sandbox.stub(serviceRequest, 'post').resolves({});
    sandbox.stub(serviceRequest, 'get').resolves({});
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

  experiment('sendNotification', () => {
    const taskConfigId = 'test-config-id';
    const licenceNumbers = ['123', '456'];
    const params = { one: 1 };
    const sender = 'test-sender';

    test('uses the preview url when no sender', async () => {
      await client.sendNotification(taskConfigId, licenceNumbers, params);
      const [url] = serviceRequest.post.lastCall.args;

      expect(url).to.equal(`https://example.com/water/notification/preview`);
    });

    test('uses the send url when a sender is passed', async () => {
      await client.sendNotification(taskConfigId, licenceNumbers, params, sender);
      const [url] = serviceRequest.post.lastCall.args;

      expect(url).to.equal(`https://example.com/water/notification/send`);
    });

    test('passes the expected body', async () => {
      await client.sendNotification(taskConfigId, licenceNumbers, params, sender);
      const [, options] = serviceRequest.post.lastCall.args;

      expect(options).to.equal({
        body: {
          filter: {
            system_external_id: {
              $in: licenceNumbers
            }
          },
          taskConfigId,
          params,
          sender
        }
      });
    });
  });

  experiment('.getNotifications', () => {
    const page = 4;

    beforeEach(async () => {
      await client.getNotifications(page);
    });

    test('calls the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/water/notifications');
    });

    test('includes the page as a query param', async () => {
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs.page).to.equal(page);
    });
  });

  experiment('.getNotification', () => {
    const eventId = 'test-event-id';

    beforeEach(async () => {
      await client.getNotification(eventId);
    });

    test('calls the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/notifications/${eventId}`);
    });
  });

  experiment('.getNotificationMessages', () => {
    const eventId = 'test-event-id';

    beforeEach(async () => {
      await client.getNotificationMessages(eventId);
    });

    test('calls the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/notifications/${eventId}/messages`);
    });
  });

  experiment('.getNotificationMessage', () => {
    const id = 'test-id';

    beforeEach(async () => {
      await client.getNotificationMessage(id);
    });

    test('calls the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(`https://example.com/water/notifications/${id}/message`);
    });
  });
});
