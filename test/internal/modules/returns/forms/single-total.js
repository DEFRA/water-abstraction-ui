const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { form: singleTotalForm } = require('internal/modules/returns/forms/single-total.js');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('internal single total form', () => {
  let request, form;
  beforeEach(async () => {
    request = createRequest();
    form = singleTotalForm(request, {
      reading: {
        units: 'l',
        totalFlag: true,
        total: 123
      }
    });
  });

  test('should be a POST form', async () => {
    expect(form.method).to.equal('POST');
  });

  test('has a radio field', async () => {
    const radio = findField(form, 'isSingleTotal');
    expect(radio).to.be.an.object();
    expect(radio.value).to.equal(true);
    expect(radio.options.label).to.equal('Is it a single volume?');
  });

  test('radio field has "yes" choice', async () => {
    const radio = findField(form, 'isSingleTotal');
    const { value, label } = radio.options.choices[0];
    expect(value).to.equal(true);
    expect(label).to.equal('Yes');
  });

  test('radio field includes nested field for single total value', async () => {
    const radio = findField(form, 'isSingleTotal');
    const [total] = radio.options.choices[0].fields;
    expect(total.options.label).to.equal('Enter the total amount');
    expect(total.options.suffix).to.equal('litres');
    expect(total.value).to.equal(123);
    expect(total.options.type).to.equal('number');
    expect(total.options.autoComplete).to.equal(true);
  });

  test('radio field has "no" choice', async () => {
    const radio = findField(form, 'isSingleTotal');
    const { value, label } = radio.options.choices[1];
    expect(value).to.equal(false);
    expect(label).to.equal('No');
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
