const { expect } = require('code');
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const { returnReceivedForm } = require('external/modules/returns/forms/return-received');

experiment('returnReceivedForm', () => {
  let request;
  let data;

  beforeEach(async () => {
    data = {};
    request = {
      view: {
        csrfToken: 'test-csrf-token'
      },
      query: {
        returnId: 'test-return-id'
      }
    };
  });

  test('has a hidden csrf field', async () => {
    const form = returnReceivedForm(request, data);
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has date field', async () => {
    const form = returnReceivedForm(request, data);
    const received = form.fields.find(x => x.name === 'receivedDate');
    expect(received.options.label).to.equal('When was the return received?');
    expect(received.options.widget).to.equal('date');
  });

  test('has a continue button', async () => {
    const form = returnReceivedForm(request, data);
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  test('sets the data if provided', async () => {
    data.receivedDate = '2018-04-27';
    const form = returnReceivedForm(request, data);
    const received = form.fields.find(x => x.name === 'receivedDate');
    expect(received.value).to.equal('2018-04-27');
  });
});
