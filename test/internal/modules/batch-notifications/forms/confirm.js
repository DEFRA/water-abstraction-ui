const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { confirmForm } = require('internal/modules/batch-notifications/forms/confirm');
const { find } = require('lodash');

experiment('confirmForm', () => {
  let form;
  beforeEach(async () => {
    const request = {
      params: {
        eventId: 'event_1'
      },
      view: {
        csrfToken: 'token'
      }
    };
    form = confirmForm(request, 10000);
  });

  test('it should be a POST form', async () => {
    expect(form.method).to.equal('POST');
  });

  test('it should have the correct action', async () => {
    expect(form.action).to.equal('/batch-notifications/send/event_1');
  });

  test('it should have a hidden CSRF token field field', async () => {
    const field = find(form.fields, { name: 'csrf_token' });
    expect(field.options.type).to.equal('hidden');
    expect(field.value).to.equal('token');
  });

  test('it should have a button with the correct text', async () => {
    const field = form.fields.find(field => field.options.widget === 'button');
    expect(field.options.label).to.equal('Send 10,000 letters');
  });
});
