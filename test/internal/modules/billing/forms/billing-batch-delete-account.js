const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { deleteAccountFromBatchForm } = require('internal/modules/billing/forms/billing-batch-delete-account');
const { findField, findButton } = require('../../../../lib/form-test');

const request = {
  view: {
    csrfToken: 'token'
  },
  params: {
    batchId: 'test-batch-id'
  }
};

const accountId = 'test-account-id';

experiment('billing/forms/billing-batch-delete-account form', () => {
  test('sets the form method to POST', async () => {
    const form = deleteAccountFromBatchForm(request, accountId);
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = deleteAccountFromBatchForm(request, accountId);
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has a submit button', async () => {
    const form = deleteAccountFromBatchForm(request, accountId);
    const button = findButton(form);
    expect(button.options.label).to.equal('Remove bill');
  });
});
