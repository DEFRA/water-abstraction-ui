const { find } = require('lodash');
const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const { internalRoutingForm } = require('../../../../../src/internal/modules/returns/forms/internal-routing');
const { scope } = require('../../../../../src/internal/lib/constants');

experiment('internalRoutingForm', () => {
  const request = {
    view: {
      csrfToken: 'xyz'
    },
    query: {
      returnId: 'abc'
    },
    auth: {
      credentials: {
        scope: [scope.internal]
      }
    }
  };

  test('it should have correct action', async () => {
    const data = {};
    const form = internalRoutingForm(request, data);

    expect(form.action).to.equal('/return/internal?returnId=abc');
  });

  test('it should include a CSRF token', async () => {
    const data = {};
    const form = internalRoutingForm(request, data);

    const field = find(form.fields, { name: 'csrf_token' });
    expect(field.options.widget).to.equal('text');
    expect(field.options.type).to.equal('hidden');
    expect(field.value).to.equal('xyz');
  });

  test('it should display correct choices if return not received and not under query', async () => {
    const data = { receivedDate: null, isUnderQuery: false };
    const form = internalRoutingForm(request, data);
    const radio = find(form.fields, { name: 'action' });
    const fieldValues = radio.options.choices.map(choice => choice.value);
    expect(fieldValues).to.equal(['submit', 'log_receipt']);
  });

  test('it should display correct choices if return is received and not under query', async () => {
    const data = { receivedDate: '2018-11-12', isUnderQuery: false };
    const form = internalRoutingForm(request, data);
    const radio = find(form.fields, { name: 'action' });
    const fieldValues = radio.options.choices.map(choice => choice.value);
    expect(fieldValues).to.equal([ 'submit', 'set_under_query' ]);
  });

  test('it should display correct choices if return not received and is under query', async () => {
    const data = { receivedDate: '2018-11-12', isUnderQuery: true };
    const form = internalRoutingForm(request, data);
    const radio = find(form.fields, { name: 'action' });
    const fieldValues = radio.options.choices.map(choice => choice.value);
    expect(fieldValues).to.equal([ 'submit', 'clear_under_query' ]);
  });
});
