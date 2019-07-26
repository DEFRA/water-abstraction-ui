const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { form: methodForm } = require('external/modules/returns/forms/method.js');

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
    expect(radio.options.choices).to.equal(
      [ { value: 'oneMeter,measured',
        label: 'Readings from a single meter' },
      { value: 'abstractionVolumes,measured',
        label: 'Volumes from one or more meters' },
      { value: 'abstractionVolumes,estimated',
        label: 'Estimates without a meter' } ]
    );
  });

  test('selects the radio option based on the reading method and type', async () => {
    form = methodForm(request, {
      reading: {
        method: 'oneMeter',
        type: 'measured'
      }
    });
    const radio = findField(form, 'method');
    expect(radio.value).to.equal('oneMeter,measured');
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
