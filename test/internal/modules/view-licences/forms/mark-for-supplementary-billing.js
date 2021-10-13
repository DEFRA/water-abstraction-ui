const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { form: markForSupplementaryBillingForm } = require('internal/modules/view-licences/forms/mark-for-supplementary-billing');

const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    licenceId: 'some-licence-id'
  }
});

experiment('mark for supplementary billing form', () => {
  let request, form;
  beforeEach(async () => {
    request = createRequest();
    form = markForSupplementaryBillingForm(request);
  });

  test('should be a POST form', async () => {
    expect(form.method).to.equal('POST');
  });

  test('has licenceId as a hidden field', async () => {
    const licenceId = findField(form, 'licenceId');
    expect(licenceId.value).to.equal('some-licence-id');
  });

  test('has CSRF token field', async () => {
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has a confirm button', async () => {
    const button = findButton(form);
    expect(button.options.label).to.equal('Confirm');
  });
});
