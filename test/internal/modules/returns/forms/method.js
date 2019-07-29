const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { form: methodForm } = require('internal/modules/returns/forms/method.js');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('internal method form', () => {
  let request, form;
  beforeEach(async () => {
    request = createRequest();
    form = methodForm(request);
  });

  test('should be a POST form', async () => {
    expect(form.method).to.equal('POST');
  });

  test('has a radio field', async () => {
    const radio = findField(form, 'method');
    expect(radio).to.be.an.object();
  });

  test('radio field has correct choices', async () => {
    const radio = findField(form, 'method');
    expect(radio.options.choices).to.equal([
      { value: 'oneMeter', label: 'Meter readings' },
      { value: 'abstractionVolumes', label: 'Abstraction volumes' }
    ]);
  });

  test('selects the radio option based on the reading method and type', async () => {
    form = methodForm(request, {
      reading: {
        method: 'oneMeter'
      }
    });
    const radio = findField(form, 'method');
    expect(radio.value).to.equal('oneMeter');
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
