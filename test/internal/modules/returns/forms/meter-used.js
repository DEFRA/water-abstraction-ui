const { expect } = require('code');
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('lab').script();
const { find, set } = require('lodash');
const { meterUsedForm } = require('../../../../../src/internal/modules/returns/forms/meter-used');

experiment('meterUsedForm', () => {
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
    const form = meterUsedForm(request, data);
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has a radio field for whether meter used field', async () => {
    const form = meterUsedForm(request, data);
    const meterUsed = find(form.fields, { name: 'meterUsed' });
    expect(meterUsed.options.label).to.equal('Did they use a meter or meters?');
    expect(meterUsed.options.widget).to.equal('radio');
  });

  test('has a continue button', async () => {
    const form = meterUsedForm(request, data);
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  test('selects "yes" radio button if reading method is measured', async () => {
    set(data, 'reading.type', 'measured');
    const form = meterUsedForm(request, data);
    const meterUsed = find(form.fields, { name: 'meterUsed' });
    expect(meterUsed.value).to.equal(true);
  });

  test('selects "no" radio button if reading method is measured', async () => {
    set(data, 'reading.type', 'estimated');
    const form = meterUsedForm(request, data);
    const meterUsed = find(form.fields, { name: 'meterUsed' });
    expect(meterUsed.value).to.equal(false);
  });
});
