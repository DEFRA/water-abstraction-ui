const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/notifications-reports/controller');
const session = require('internal/modules/notifications-reports/lib/session');
const services = require('internal/lib/connectors/services');

const eventId = 'test-event-id';

const data = {
  pagination: {
    page: 3,
    perPage: 50,
    totalRows: 223,
    pageCount: 5
  },
  events: [{
    id: eventId
  }],
  messages: [{
    displayStatus: 'pending'
  }, {
    displayStatus: 'sent'
  }, {
    displayStatus: 'error'
  }]
};

const categories = [
  {
    value: 'some-category',
    label: 'Some category'
  }
];

const sender = 'some@email.com';

experiment('internal/modules/notification-reports/controller.js', () => {
  let request;
  let h;

  beforeEach(async () => {
    sandbox.stub(services.water.notifications, 'getNotifications');
    sandbox.stub(services.water.notifications, 'getNotification');
    sandbox.stub(services.water.notifications, 'getNotificationMessages');
    sandbox.stub(session, 'get').returns({ categories, sender });
    sandbox.stub(session, 'merge');
    sandbox.stub(session, 'clear');

    request = {
      params: {
        id: eventId
      },
      query: {
        page: 3
      },
      method: 'post',
      payload: {},
      pre: {
        notificationCategories: []
      },
      view: {}
    };

    h = sandbox.spy();
    h.view = sandbox.spy();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getNotification', () => {
    beforeEach(async () => {
      services.water.notifications.getNotifications.resolves({
        data: data.events,
        pagination: data.pagination
      });

      await controller.getNotificationsList(request, h);
    });

    test('calls the water service notifications API', async () => {
      expect(services.water.notifications.getNotifications.calledWith(
        request.query.page,
        categories,
        sender
      )).to.be.true();
    });

    test('uses the expected view template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/notifications-reports/list');
    });

    test('outputs the events to the view', async () => {
      const [, { events }] = h.view.lastCall.args;
      expect(events).to.equal(data.events);
    });

    test('outputs the pagination to the view', async () => {
      const [, { pagination }] = h.view.lastCall.args;
      expect(pagination).to.equal(data.pagination);
    });
  });

  experiment('.getNotification', () => {
    experiment('when the notification is found', () => {
      beforeEach(async () => {
        services.water.notifications.getNotification.resolves(data.events[0]);
        services.water.notifications.getNotificationMessages.resolves({ data: data.messages });

        await controller.getNotification(request, h);
      });

      test('calls the water service notification API', async () => {
        expect(services.water.notifications.getNotification.calledWith(
          eventId
        )).to.be.true();
      });

      test('calls the water service notification messages API', async () => {
        expect(services.water.notifications.getNotificationMessages.calledWith(
          eventId
        )).to.be.true();
      });

      test('uses the expected view template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/notifications-reports/report');
      });

      test('defines a back link', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal('/notifications/report');
      });

      test('outputs the notification event to the view', async () => {
        const [, { event }] = h.view.lastCall.args;
        expect(event).to.equal(data.events[0]);
      });

      test('maps the messages to include a status badge', async () => {
        const [, { messages }] = h.view.lastCall.args;
        expect(messages[0].badge).to.equal({ text: 'Pending' });
        expect(messages[1].badge).to.equal({ text: 'Sent' });
        expect(messages[2].badge).to.equal({ text: 'Error', status: 'error' });
      });
    });

    experiment('when the notification is not found', () => {
      let response;

      const err = new Error();
      err.statusCode = 404;

      beforeEach(async () => {
        services.water.notifications.getNotification.rejects(err);
        services.water.notifications.getNotificationMessages.resolves({ data: data.messages });

        response = await controller.getNotification(request, h);
      });

      test('a Boom 404 is returned', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(404);
      });
    });

    experiment('when there is an unexpected error', () => {
      const err = new Error('oops');

      beforeEach(async () => {
        services.water.notifications.getNotification.rejects(err);
        services.water.notifications.getNotificationMessages.resolves({ data: data.messages });
      });

      test('the function rejects with the error', async () => {
        const func = () => controller.getNotification(request, h);
        const response = await expect(func()).to.reject();
        expect(response).to.equal(err);
      });
    });
  });
});
