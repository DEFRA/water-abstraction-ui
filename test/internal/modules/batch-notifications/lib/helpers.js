const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach, fail } = exports.lab = require('@hapi/lab').script();

const services = require('internal/lib/connectors/services');
const helpers = require('internal/modules/batch-notifications/lib/helpers');

experiment('batch notification helpers', () => {
  const eventId = 'event_1';

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('loadEvent', () => {
    const request = {
      params: {
        eventId
      },
      defra: {
        userName: 'mail@example.com'
      }
    };

    beforeEach(async () => {
      sandbox.stub(services.water.events, 'findOne');
    });

    test('rejects if the API returns an error response', async () => {
      services.water.events.findOne.resolves({ error: 'oh no!' });
      expect(helpers.loadEvent()).to.reject();
    });

    test('rejects with Boom unauthorized if event issuer does not match current user', async () => {
      services.water.events.findOne.resolves({ data: { issuer: 'bob@example.com' } });
      try {
        await helpers.loadEvent(request);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(401);
      }
    });

    test('rejects with Boom bad request if event is not a notification', async () => {
      services.water.events.findOne.resolves({ data: {
        issuer: 'mail@example.com',
        type: 'notANotification'
      } });
      try {
        await helpers.loadEvent(request);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(400);
      }
    });

    test('resolves with event data if notification and issuer matches current user', async () => {
      services.water.events.findOne.resolves({ data: {
        eventId,
        issuer: 'mail@example.com',
        type: 'notification'
      } });

      const result = await helpers.loadEvent(request);
      expect(result.eventId).to.equal(eventId);
    });
  });
  experiment('loadMessages', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.notifications, 'findAll').resolves([{
        id: 'message_1'
      }]);
    });

    test('loads messages from water service matching event ID', async () => {
      await helpers.loadMessages({ event_id: eventId });
      expect(services.water.notifications.findAll.callCount).to.equal(1);
      const [filter] = services.water.notifications.findAll.lastCall.args;
      expect(filter).to.equal({ event_id: eventId });
    });

    test('resolves with data from API call', async () => {
      const result = await helpers.loadMessages({ event_id: eventId });
      expect(result).to.equal([ { id: 'message_1' } ]);
    });
  });
});
