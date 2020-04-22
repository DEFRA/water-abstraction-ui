const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const confirmForm = require('internal/modules/billing/forms/confirm-form');
const { findField, findButton } = require('../../../../lib/form-test');

const request = {
  view: { csrfToken: 'csrf-token' }
};

const action = '/post/to/this/url';

experiment('/internal/modules/billing/form/confirm-form .form', () => {
  let form;
  beforeEach(() => {
    form = confirmForm(request, action, 'button text');
  });

  test('has CSRF token field', async () => {
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('sets the form method to POST', async () => {
    expect(form.method).to.equal('POST');
  });

  test('sets the correct form action', async () => {
    expect(form.action).to.equal(action);
  });

  test('has a button with the correct label', async () => {
    const button = findButton(form);
    expect(button.options.label).to.equal('button text');
  });
});
