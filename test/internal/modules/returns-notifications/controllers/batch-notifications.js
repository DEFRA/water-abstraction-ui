'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns-notifications/controllers/batch-notifications');
const services = require('internal/lib/connectors/services');

experiment('getReturnsNotificationsStart', () => {
  let request;
  let h;

  beforeEach(async () => {
    request = {
      view: {
        path: '/returns-notifications/reminders'
      }
    };

    h = {
      view: sandbox.spy()
    };

    await controller.getReturnsNotificationsStart(request, h);
  });

  test('the expected view template is used', async () => {
    const [templateName] = h.view.lastCall.args;
    expect(templateName).to.equal('nunjucks/returns-notifications/notifications');
  });

  test('view context is assigned a back link path', async () => {
    const [, view] = h.view.lastCall.args;
    expect(view.back).to.equal('/notifications');
  });

  experiment('Return Reminders', () => {
    beforeEach(async () => {
      request = {
        view: {
          path: '/returns-notifications/reminders'
        }
      };

      h = {
        view: sandbox.spy()
      };

      await controller.getReturnsNotificationsStart(request, h);
    });

    test('view context is assigned a form', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.form.action).to.equal('/returns-notifications/reminders');
    });
  });

  experiment('Return Invitations', () => {
    let request;
    let h;

    beforeEach(async () => {
      request = {
        view: {
          path: '/returns-notifications/invitations'
        }
      };

      h = {
        view: sandbox.spy()
      };

      await controller.getReturnsNotificationsStart(request, h);
    });

    test('view context is assigned a form', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.form.action).to.equal('/returns-notifications/invitations');
    });
  });
});

experiment('postReturnsNotificationsStart', () => {
  let request;
  let h;
  let username;

  beforeEach(async () => {
    username = 'test@example.com';
    h = {
      redirect: sandbox.spy()
    };

    request = {
      view: {
        csrfToken: 'test-csrf-token'
      },
      auth: {
        credentials: {
          scope: ['internal']
        }
      },
      defra: {
        userName: username
      },
      path: '/return-notifications/reminders',
      payload: {
        excludeLicences: '123\n456'
      }
    };

    sandbox.stub(services.water.batchNotifications, 'prepareReturnsReminders').resolves({
      data: {
        id: 'test-event-id'
      }
    });

    sandbox.stub(services.water.batchNotifications, 'prepareReturnsInvitations').resolves({
      data: {
        id: 'test-event-id'
      }
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });
  test('the username is used as the notification issuer', async () => {
    await controller.postReturnsNotificationsStart(request, h);
    const [issuer] = services.water.batchNotifications.prepareReturnsReminders.lastCall.args;
    expect(issuer).to.equal(username);
  });

  test('the excluded licences are passed as csv', async () => {
    await controller.postReturnsNotificationsStart(request, h);
    const [, excludeLicences] = services.water.batchNotifications.prepareReturnsReminders.lastCall.args;
    expect(excludeLicences).to.equal(['123', '456']);
  });

  test('the user is redirected to the event waiting page', async () => {
    await controller.postReturnsNotificationsStart(request, h);
    const [url] = h.redirect.lastCall.args;
    expect(url).to.equal('/waiting/test-event-id');
  });

  experiment('Return Reminders', () => {
    beforeEach(async () => {
      request = {
        view: {
          csrfToken: 'test-csrf-token'
        },
        auth: {
          credentials: {
            scope: ['internal']
          }
        },
        defra: {
          userName: username
        },
        path: '/return-notifications/reminders',
        payload: {
          excludeLicences: '123\n456'
        }
      };
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('the returnReminder connector is called', async () => {
      await controller.postReturnsNotificationsStart(request, h);
      const previouslyCalled = services.water.batchNotifications.prepareReturnsReminders.calledWith(username, ['123', '456']);
      expect(previouslyCalled).to.be.true();
    });
  });

  experiment('Return Reminders', () => {
    beforeEach(async () => {
      request = {
        view: {
          csrfToken: 'test-csrf-token'
        },
        auth: {
          credentials: {
            scope: ['internal']
          }
        },
        defra: {
          userName: username
        },
        path: '/return-notifications/invitations',
        payload: {
          excludeLicences: '123\n456'
        }
      };
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('the returnInvitations connector is called', async () => {
      await controller.postReturnsNotificationsStart(request, h);
      const previouslyCalled = services.water.batchNotifications.prepareReturnsInvitations.calledWith(username, ['123', '456']);
      expect(previouslyCalled).to.be.true();
    });
  });
});
