const { expect } = require('code');
const moment = require('moment');
const { find } = require('lodash');
const { experiment, test, beforeEach } = exports.lab = require('lab').script();
const { logReceiptForm, logReceiptSchema } = require('external/modules/returns/forms/log-receipt');
const { scope } = require('external/lib/constants');

experiment('logReceiptForm', () => {
  let form, request;

  beforeEach(async () => {
    request = {
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

    form = logReceiptForm(request);
  });

  test('should contain the correct fields', async () => {
    const names = form.fields.map(row => row.name).filter(x => x);
    expect(names).to.include(['csrf_token', 'date_received', 'isUnderQuery']);
  });

  test('should include the CSRF token from the request', async () => {
    const csrf = find(form.fields, { name: 'csrf_token' });
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('the received date field should default to today', async () => {
    const today = moment().format('YYYY-MM-DD');
    const date = find(form.fields, { name: 'date_received' });
    expect(date.value).to.equal(today);
  });
});

experiment('logReceiptSchema', () => {
  test('should contain the correct fields', async () => {
    const schema = logReceiptSchema();
    const keys = Object.keys(schema);
    expect(keys).to.only.include(['csrf_token', 'date_received', 'isUnderQuery']);
  });
});
