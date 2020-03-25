const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { cancelOrConfirmBatchForm } = require('internal/modules/billing/forms/cancel-or-confirm-batch');
const { findField, findButton } = require('../../../../lib/form-test');

const request = {
  view: {
    csrfToken: 'token'
  },
  params: {
    batchId: 'test-batch-id'
  }
};

experiment('billing/forms/cancel-or-confirm-batch .form', () => {
  test('has CSRF token field', async () => {
    const form = cancelOrConfirmBatchForm(request, 'cancel');
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('sets the form method to POST', async () => {
    const form = cancelOrConfirmBatchForm(request, 'confirm');
    expect(form.method).to.equal('POST');
  });

  experiment('cancel batch', async () => {
    let form;
    beforeEach(async () => {
      form = cancelOrConfirmBatchForm(request, 'cancel');
    });

    test('sets the correct form action', async () => {
      expect(form.action).to.equal(`/billing/batch/${request.params.batchId}/cancel`);
    });

    test('has a submit button', async () => {
      const button = findButton(form);
      expect(button.options.label).to.equal('Cancel bill run');
    });
  });

  experiment('confirm batch', async () => {
    let form;
    beforeEach(async () => {
      form = cancelOrConfirmBatchForm(request, 'confirm');
    });

    test('sets the correct form action', async () => {
      expect(form.action).to.equal(`/billing/batch/${request.params.batchId}/confirm`);
    });

    test('has a submit button', async () => {
      const button = findButton(form);
      expect(button.options.label).to.equal('Send bill run');
    });
  });
});
