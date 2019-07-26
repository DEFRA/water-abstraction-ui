const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { form: meterResetForm } = require('external/modules/returns/forms/meter-reset.js');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('external meter reset form', () => {
  let request, form;
  beforeEach(async () => {
    request = createRequest();
    form = meterResetForm(request);
  });

  test('should be a POST form', async () => {
    expect(form.method).to.equal('POST');
  });

  test('has a radio field', async () => {
    const radio = findField(form, 'meterReset');
    expect(radio.options.label).to.equal('Did your meter reset in this abstraction period?');
  });

  test('has yes option', async () => {
    const radio = findField(form, 'meterReset');
    expect(radio.options.choices[0]).to.equal({
      value: true,
      label: 'Yes',
      hint: 'You will need to provide abstraction volumes instead of meter readings'
    });
  });

  test('has no option', async () => {
    const radio = findField(form, 'meterReset');
    expect(radio.options.choices[1]).to.equal({
      value: false,
      label: 'No'
    });
  });

  test('has CSRF token field', async () => {
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has a continue button', async () => {
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});
