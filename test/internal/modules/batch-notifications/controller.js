'use strict';

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const controller = require('internal/modules/batch-notifications/controller');
const helpers = require('internal/modules/batch-notifications/lib/helpers');
const csv = require('internal/lib/csv-download');
const services = require('internal/lib/connectors/services');

experiment('batch notifications controller', () => {
  let h;
  const eventId = 'event_1';
  const username = 'mail@example.com';

  const request = {
    params: {
      eventId
    },
    view: {
      csrfToken: 'token'
    },
    defra: {
      userName: username
    }
  };

  const ev = {
    event_id: eventId,
    reference_code: 'ABC',
    subtype: 'returnReminder',
    metadata: {
      name: 'Returns: reminder',
      recipients: 10000
    }
  };

  const messages = [{
    id: 'message_1',
    personalisation: {
      foo: 'bar'
    },
    recipient: 'n/a',
    message_type: 'letter'
  }];

  beforeEach(async () => {
    sandbox.stub(helpers, 'loadEvent').resolves(ev);
    sandbox.stub(helpers, 'loadMessages').resolves(messages);
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    };
    sandbox.stub(csv, 'csvDownload').resolves();
    sandbox.stub(services.water.batchNotifications, 'sendReminders').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getReview', () => {
    beforeEach(async () => {
      await controller.getReview(request, h);
    });

    test('passes the current request to helpers.loadEvent', async () => {
      expect(helpers.loadEvent.callCount).to.equal(1);
      const { args } = helpers.loadEvent.lastCall;
      expect(args).to.equal([request]);
    });

    test('renders the correct template', async () => {
      const [ template ] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/batch-notifications/review.njk');
    });

    test('outputs correct data to view', async () => {
      const [ , data ] = h.view.lastCall.args;
      expect(data.pageTitle).to.equal('Send returns reminders');
      expect(data.form).to.be.an.object();
      expect(data.ev).to.equal(ev);
      expect(data.csvPath).to.equal('/batch-notifications/csv/event_1');
      expect(data.back).to.equal('/returns-notifications/reminders');
    });
  });

  experiment('getRecipientsCSV', () => {
    beforeEach(async () => {
      await controller.getRecipientsCSV(request, h);
    });

    test('passes the current request to helpers.loadEvent', async () => {
      expect(helpers.loadEvent.callCount).to.equal(1);
      const { args } = helpers.loadEvent.lastCall;
      expect(args).to.equal([request]);
    });

    test('passes the event to helpers.loadMessages', async () => {
      expect(helpers.loadMessages.callCount).to.equal(1);
      const { args } = helpers.loadMessages.lastCall;
      expect(args).to.equal([ev]);
    });

    test('passes the correct data to csv download', async () => {
      expect(csv.csvDownload.callCount).to.equal(1);
      const [, data, filename] = csv.csvDownload.lastCall.args;
      expect(filename).to.equal('Returns: reminder - ABC.csv');
      expect(data).to.equal([ { foo: 'bar', message_type: 'letter', recipient: 'n/a' } ]);
    });
  });

  experiment('postSendNotification', () => {
    beforeEach(async () => {
      await controller.postSendNotification(request, h);
    });

    test('calls water service batch notifications API with event ID and issuer', async () => {
      const { args } = services.water.batchNotifications.sendReminders.lastCall;
      expect(args[0]).to.equal(eventId);
      expect(args[1]).to.equal(username);
    });

    test('redirects to confirmation page', async () => {
      expect(h.redirect.callCount).to.equal(1);
      const [ path ] = h.redirect.lastCall.args;
      expect(path).to.equal('/batch-notifications/confirmation/event_1');
    });
  });

  experiment('getConfirmation', () => {
    beforeEach(async () => {
      await controller.getConfirmation(request, h);
    });

    test('passes the current request to helpers.loadEvent', async () => {
      expect(helpers.loadEvent.callCount).to.equal(1);
      const { args } = helpers.loadEvent.lastCall;
      expect(args).to.equal([request]);
    });

    test('renders the correct template', async () => {
      const [ template ] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/batch-notifications/confirmation.njk');
    });

    test('outputs correct data to view', async () => {
      const [ , data ] = h.view.lastCall.args;
      expect(data.event).to.equal(ev);
    });
    test('uses correct confirmation heading', async () => {
      const [ , data ] = h.view.lastCall.args;
      expect(data.pageTitle).to.equal('Return reminders sent');
    });
  });
});
