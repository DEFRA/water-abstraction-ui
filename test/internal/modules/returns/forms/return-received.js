const { expect } = require('@hapi/code');
const moment = require('moment');
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { form: returnReceivedForm } = require('internal/modules/returns/forms/return-received');

const { find } = require('lodash');

const findField = (form, name) => find(form.fields, { name });
const findRadioField = form => findField(form, 'receivedDate');
const findCustomChoice = form => find(findRadioField(form).options.choices, { value: 'custom' });
const findDateField = form => findField(findCustomChoice(form), 'customDate');

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
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has a radio field', async () => {
    const form = returnReceivedForm(request, data);
    const field = findRadioField(form);
    expect(field.options.widget).to.equal('radio');
  });

  test('radio field has options for today, yesterday, custom', async () => {
    const form = returnReceivedForm(request, data);
    const field = findRadioField(form);
    const labels = field.options.choices.map(choice => choice.label);
    const values = field.options.choices.map(choice => choice.value);
    expect(labels).to.equal(['Today', 'Yesterday', 'Custom date']);
    expect(values).to.equal(['today', 'yesterday', 'custom']);
  });

  test('custom radio option has conditional date field', async () => {
    const form = returnReceivedForm(request, data);
    const dateField = findDateField(form);
    expect(dateField.options.widget).to.equal('date');
  });

  test('has a continue button', async () => {
    const form = returnReceivedForm(request, data);
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  test('if received date is today, today choice is selected', async () => {
    const today = moment().format('YYYY-MM-DD');
    const form = returnReceivedForm(request, { receivedDate: today });
    const radio = findRadioField(form);
    expect(radio.value).to.equal('today');
  });

  test('if received date is yesterday, yesterday choice is selected', async () => {
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const form = returnReceivedForm(request, { receivedDate: yesterday });
    const radio = findRadioField(form);
    expect(radio.value).to.equal('yesterday');
  });

  test('if received date is not today or yesterday, custom choice is selected', async () => {
    const custom = moment().subtract(2, 'day').format('YYYY-MM-DD');
    const form = returnReceivedForm(request, { receivedDate: custom });
    const radio = findRadioField(form);
    expect(radio.value).to.equal('custom');

    const dateField = findDateField(form);
    expect(dateField.value).to.equal(custom);
  });

  test('if received date is empty, no choice is selected', async () => {
    const form = returnReceivedForm(request, { receivedDate: null });
    const radio = findRadioField(form);
    expect(radio.value).to.be.undefined();
  });
});
