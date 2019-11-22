const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { selectBillingTypeForm, billingTypeFormSchema } = require('internal/modules/billing/forms/billing-type');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

experiment('billing/forms/billing-type form', () => {
  test('sets the form method to POST', async () => {
    const form = selectBillingTypeForm(createRequest());
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = selectBillingTypeForm(createRequest());
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has a billing type field', async () => {
    const form = selectBillingTypeForm(createRequest());
    const billingType = findField(form, 'selectedBillingType');
    expect(billingType).to.exist();
  });

  test('has a submit button', async () => {
    const form = selectBillingTypeForm(createRequest());
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('account/forms/billing-region schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = billingTypeFormSchema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = billingTypeFormSchema.csrf_token.validate('pizza');
      expect(result.error).to.exist();
    });
  });

  experiment('billing type', () => {
    test('validates for a string', async () => {
      const result = billingTypeFormSchema.selectedBillingType.validate('annual');
      expect(result.error).to.be.null();
    });

    test('fails if blank', async () => {
      const result = billingTypeFormSchema.selectedBillingType.validate();
      expect(result.error).to.exist();
    });
  });
});
