const moment = require('moment');
const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns-notifications/controller');
const services = require('internal/lib/connectors/services');

const createLicence = (id, overrides = {}) => {
  return {
    licence_ref: `l${id}`,
    return_id: `r${id}`,
    dateRevoked: overrides.dateRevoked || null,
    dateExpired: overrides.dateExpired || null,
    dateLapsed: overrides.dateLapsed || null
  };
};

experiment('postPreviewRecipients', () => {
  let h;
  let request;

  beforeEach(async () => {
    h = { view: sandbox.spy() };

    request = {
      payload: {
        licenceNumbers: 'l1 l2 l3 l4 l5 l6',
        csrf_token: 'bfc56166-e983-4f01-90fe-f70c191017ca'
      },
      view: {},
      log: sandbox.spy(),
      defra: {
        userName: 'test-user@example.com'
      }
    };

    sandbox.stub(services.water.returnsNotifications, 'previewPaperForms').resolves({
      error: null,
      data: [
        createLicence(1),
        createLicence(2, { dateRevoked: '20020202' }),
        createLicence(3, { dateExpired: '20030303' }),
        createLicence(4, { dateLapsed: '20040404' }),
        createLicence(5, { dateRevoked: '20050505', dateExpired: '20050505' })
      ]
    });
  });

  afterEach(async () => { sandbox.restore(); });

  experiment('when the form is not valid', () => {
    test('the form view is shown again', async () => {
      request.payload = { licenceNumbers: '' };
      await controller.postPreviewRecipients(request, h);
      const [viewName] = h.view.lastCall.args;
      expect(viewName).to.equal('nunjucks/form');
    });
  });

  experiment('when there is an error previewing the forms', () => {
    test('a boom error is thrown', async () => {
      services.water.returnsNotifications.previewPaperForms.resolves({
        error: {
          name: 'test-error',
          message: 'test-error-message'
        },
        data: null
      });

      const err = await expect(controller.postPreviewRecipients(request, h)).to.reject();
      expect(err.isBoom).to.be.true();
      expect(err.data).to.equal({ name: 'test-error', message: 'test-error-message' });
    });
  });

  experiment('when the data is valid', () => {
    test('the confirm view is rendered', async () => {
      await controller.postPreviewRecipients(request, h);
      const [viewName] = h.view.lastCall.args;
      expect(viewName).to.equal('nunjucks/returns-notifications/forms-confirm');
    });

    test('the found licences are added to the view', async () => {
      await controller.postPreviewRecipients(request, h);
      const [, context] = h.view.lastCall.args;
      expect(context.uniqueLicences[0].licence_ref).to.equal('l1');
      expect(context.uniqueLicences[1].licence_ref).to.equal('l2');
      expect(context.uniqueLicences[2].licence_ref).to.equal('l3');
      expect(context.uniqueLicences[3].licence_ref).to.equal('l4');
      expect(context.uniqueLicences[4].licence_ref).to.equal('l5');
    });

    test('licences that are not matched are added to the view', async () => {
      await controller.postPreviewRecipients(request, h);
      const [, context] = h.view.lastCall.args;
      expect(context.notMatched).to.equal(['l6']);
    });

    test('licence objects with end dates contain endedReasons', async () => {
      await controller.postPreviewRecipients(request, h);
      const [, context] = h.view.lastCall.args;
      const [l1, l2, l3, l4, l5] = context.uniqueLicences;
      expect(l1.endedReasons).to.equal('');
      expect(l2.endedReasons).to.equal('Revoked');
      expect(l3.endedReasons).to.equal('Expired');
      expect(l4.endedReasons).to.equal('Lapsed');
      expect(l5.endedReasons).to.equal('Revoked, Expired');
    });

    test('licence objects with future end dates do not have endedReasons', async () => {
      const futureDate = moment().add(1, 'year').format('YYYYMMDD');

      services.water.returnsNotifications.previewPaperForms.resolves({
        error: null,
        data: [
          createLicence(1, { dateRevoked: futureDate }),
          createLicence(2, { dateExpired: futureDate }),
          createLicence(3, { dateLapsed: futureDate })
        ]
      });

      await controller.postPreviewRecipients(request, h);
      const [, context] = h.view.lastCall.args;
      const [l1, l2, l3] = context.uniqueLicences;
      expect(l1.endedReasons).to.equal('');
      expect(l2.endedReasons).to.equal('');
      expect(l3.endedReasons).to.equal('');
    });
  });
});

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
