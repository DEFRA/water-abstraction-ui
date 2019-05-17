const waterConnector = require('../../../../src/external/lib/connectors/water');
const controller = require('../../../../src/external/modules/waiting/controller');

const { expect } = require('code');
const {
  test,
  experiment,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const getTestEventResponse = (status = 'processing', subtype = 'returnReminder') => ({
  data: {
    event_id: 'test-event-id',
    status,
    metadata: {
      name: 'test-event-name'
    },
    subtype
  },
  error: null
});

experiment('getWaiting', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(waterConnector.events, 'findOne').resolves(getTestEventResponse());

    h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    request = {
      params: {
        eventId: 'test-event-id'
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the event id from the params to get the event', async () => {
    await controller.getWaiting(request, h);
    const [eventId] = waterConnector.events.findOne.lastCall.args;
    expect(eventId).to.equal(request.params.eventId);
  });

  experiment('for an event sub type of returnReminder', () => {
    test('throws an error if there is an error getting the event', async () => {
      waterConnector.events.findOne.resolves({
        error: 'bah',
        data: null
      });

      await expect(controller.getWaiting(request, h)).to.reject();
    });

    experiment('when the event status is processing', () => {
      test('the waiting page is rendered', async () => {
        waterConnector.events.findOne.resolves(getTestEventResponse('processing'));
        await controller.getWaiting(request, h);

        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/waiting/index.njk');
      });

      test('sets the correct page title', async () => {
        waterConnector.events.findOne.resolves(getTestEventResponse('processing'));
        await controller.getWaiting(request, h);

        const [, context] = h.view.lastCall.args;
        expect(context.pageTitle).to.equal('Send returns reminders');
      });
    });

    experiment('when the event status is error', () => {
      test('an error is thrown', async () => {
        waterConnector.events.findOne.resolves(getTestEventResponse('error'));
        const err = await expect(controller.getWaiting(request, h)).to.reject();

        expect(err.isBoom).to.be.true();
        expect(err.output.statusCode).to.equal(500);
      });
    });

    experiment('when the event status is processed', () => {
      test('the user is redirected to the review page', async () => {
        waterConnector.events.findOne.resolves(getTestEventResponse('processed'));
        await controller.getWaiting(request, h);

        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/admin/batch-notifications/review/test-event-id');
      });
    });
  });

  experiment('for an event sub type of returnInvitation', () => {
    experiment('when the event status is processing', () => {
      test('the waiting page is rendered', async () => {
        waterConnector.events.findOne.resolves(getTestEventResponse('processing', 'returnInvitation'));
        await controller.getWaiting(request, h);

        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/waiting/index.njk');
      });

      test('sets the correct page title', async () => {
        waterConnector.events.findOne.resolves(getTestEventResponse('processing', 'returnInvitation'));
        await controller.getWaiting(request, h);

        const [, context] = h.view.lastCall.args;
        expect(context.pageTitle).to.equal('Send returns invitations');
      });
    });

    experiment('when the event status is error', () => {
      test('an error is thrown', async () => {
        waterConnector.events.findOne.resolves(getTestEventResponse('error', 'returnInvitation'));
        const err = await expect(controller.getWaiting(request, h)).to.reject();

        expect(err.isBoom).to.be.true();
        expect(err.output.statusCode).to.equal(500);
      });
    });

    experiment('when the event status is processed', () => {
      test('the user is redirected to the review page', async () => {
        waterConnector.events.findOne.resolves(getTestEventResponse('processed', 'returnInvitation'));
        await controller.getWaiting(request, h);

        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/admin/batch-notifications/review/test-event-id');
      });
    });
  });
});
