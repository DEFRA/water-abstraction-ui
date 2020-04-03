'use strict';

const services = require('internal/lib/connectors/services');
const controller = require('internal/modules/waiting/controller');

const { expect } = require('@hapi/code');
const {
  test,
  experiment,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const getTestEventResponse = (status = 'processing', subtype = 'returnReminder') => ({
  data: {
    id: 'test-event-id',
    type: 'notification',
    status,
    metadata: {
      name: 'test-event-name'
    },
    subtype
  },
  error: null
});

const getTestEventResponseBillRun = (status = 'processing', subtype = 'annual') => ({
  data: {
    id: 'test-event-id',
    type: 'billing-batch',
    status,
    metadata: {
      name: 'test-event-name',
      batch: {
        id: 'test-batch-id',
        regionId: 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
        region: {
          displayName: 'Midlands'
        }
      }
    },
    subtype
  },
  error: null
});

experiment('internal/modules/waiting/controller', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(services.water.events, 'findOne').resolves(getTestEventResponse());

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
    const [eventId] = services.water.events.findOne.lastCall.args;
    expect(eventId).to.equal(request.params.eventId);
  });

  experiment('for an event sub type of returnReminder', () => {
    test('throws an error if there is an error getting the event', async () => {
      services.water.events.findOne.resolves({
        error: 'bah',
        data: null
      });

      await expect(controller.getWaiting(request, h)).to.reject();
    });

    experiment('when the event status is processing', () => {
      test('the waiting page is rendered', async () => {
        services.water.events.findOne.resolves(getTestEventResponse('processing'));
        await controller.getWaiting(request, h);

        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/waiting/index');
      });

      test('sets the correct page title', async () => {
        services.water.events.findOne.resolves(getTestEventResponse('processing'));
        await controller.getWaiting(request, h);

        const [, context] = h.view.lastCall.args;
        expect(context.pageTitle).to.equal('Send returns reminders');
      });
    });

    experiment('when the event status is error', () => {
      test('an error is thrown', async () => {
        services.water.events.findOne.resolves(getTestEventResponse('error'));
        const err = await expect(controller.getWaiting(request, h)).to.reject();

        expect(err.isBoom).to.be.true();
        expect(err.output.statusCode).to.equal(500);
      });
    });

    experiment('when the event status is processed', () => {
      test('the user is redirected to the review page', async () => {
        services.water.events.findOne.resolves(getTestEventResponse('processed'));
        await controller.getWaiting(request, h);

        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/batch-notifications/review/test-event-id');
      });

      test('the user is redirected to the review page when event id is found at event.event_id', async () => {
        services.water.events.findOne.resolves({ data: { event_id: 'test-id', type: 'notification', status: 'processed' }, error: null });
        await controller.getWaiting(request, h);

        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/batch-notifications/review/test-id');
      });
    });
  });

  experiment('for an event sub type of returnInvitation', () => {
    experiment('when the event status is processing', () => {
      test('the waiting page is rendered', async () => {
        services.water.events.findOne.resolves(getTestEventResponse('processing', 'returnInvitation'));
        await controller.getWaiting(request, h);

        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/waiting/index');
      });

      test('sets the correct page title', async () => {
        services.water.events.findOne.resolves(getTestEventResponse('processing', 'returnInvitation'));
        await controller.getWaiting(request, h);

        const [, context] = h.view.lastCall.args;
        expect(context.pageTitle).to.equal('Send returns invitations');
      });
    });

    experiment('when the event status is error', () => {
      test('an error is thrown', async () => {
        services.water.events.findOne.resolves(getTestEventResponse('error', 'returnInvitation'));
        const err = await expect(controller.getWaiting(request, h)).to.reject();

        expect(err.isBoom).to.be.true();
        expect(err.output.statusCode).to.equal(500);
      });
    });

    experiment('when the event status is processed', () => {
      test('the user is redirected to the review page', async () => {
        services.water.events.findOne.resolves(getTestEventResponse('processed', 'returnInvitation'));
        await controller.getWaiting(request, h);

        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/batch-notifications/review/test-event-id');
      });
    });
  });
});

experiment('internal/modules/waiting/controller', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(services.water.events, 'findOne').resolves(getTestEventResponseBillRun());

    h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    request = {
      query: {
        back: 0
      },
      params: {
        eventId: 'test-event-id'
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the event id from the params to get the event for a bill run', async () => {
    await controller.getWaiting(request, h);
    const [eventId] = services.water.events.findOne.lastCall.args;
    expect(eventId).to.equal(request.params.eventId);
  });

  experiment('for an event sub type of bill run', () => {
    test('throws an error if there is an error getting the event', async () => {
      services.water.events.findOne.resolves({
        error: 'bah',
        data: null
      });

      await expect(controller.getWaiting(request, h)).to.reject();
    });

    experiment('when the event status is processing for a bill run', () => {
      test('the waiting page is rendered', async () => {
        services.water.events.findOne.resolves(getTestEventResponseBillRun('processing', 'annual'));
        await controller.getWaiting(request, h);

        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/waiting/index');
      });

      test('sets the correct page title for a bill run', async () => {
        services.water.events.findOne.resolves(getTestEventResponseBillRun('processing', 'annual'));
        await controller.getWaiting(request, h);

        const [, context] = h.view.lastCall.args;
        expect(context.pageTitle).to.equal('Midlands annual bill run');
      });
    });

    experiment('when the event status is error for a bill run', () => {
      test('an error is thrown', async () => {
        services.water.events.findOne.resolves(getTestEventResponseBillRun('error'));
        const err = await expect(controller.getWaiting(request, h)).to.reject();

        expect(err.isBoom).to.be.true();
        expect(err.output.statusCode).to.equal(500);
      });
    });

    experiment('when the event status is complete for a bill run', () => {
      test('the user is redirected to the review page', async () => {
        services.water.events.findOne.resolves(getTestEventResponseBillRun('complete'));
        await controller.getWaiting(request, h);

        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/billing/batch/test-batch-id/summary?back=0');
      });
    });
  });
});
