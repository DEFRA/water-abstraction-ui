const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { form: unitsForm } = require('external/modules/returns/forms/units.js');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('external units form', () => {
  let request, form;
  beforeEach(async () => {
    request = createRequest();
    form = unitsForm(request);
  });

  test('should be a POST form', async () => {
    expect(form.method).to.equal('POST');
  });

  test('has a radio field', async () => {
    const radio = findField(form, 'units');
    expect(radio).to.be.an.object();
  });

  test('radio field has correct choices', async () => {
    const radio = findField(form, 'units');
    expect(radio.options.choices).to.equal([
      { value: 'm³', label: 'Cubic metres' },
      { value: 'l', label: 'Litres' },
      { value: 'Ml', label: 'Megalitres' },
      { value: 'gal', label: 'Gallons' }
    ]);
  });

  test('selects the radio option based on the reading units', async () => {
    form = unitsForm(request, {
      reading: {
        units: 'gal'
      }
    });
    const radio = findField(form, 'units');
    expect(radio.value).to.equal('gal');
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
