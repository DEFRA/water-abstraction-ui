const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { form: confirmForm } = require('external/modules/returns/forms/confirm.js');

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
    form = confirmForm(request);
  });

  test('should be a POST form', async () => {
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has a submit button', async () => {
    const button = findButton(form);
    expect(button.options.label).to.equal('Submit');
  });
});
