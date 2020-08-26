'use strict';

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { checkDetailsForm } = require('internal/modules/invoice-accounts/forms/check-details');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  },
  params: {
    regionId: uuid(),
    companyId: uuid()
  }
});

experiment('invoice-accounts/forms/check-details form', () => {
  let request;

  beforeEach(async => {
    request = createRequest();
  });

  test('sets the form method to POST', async () => {
    const form = checkDetailsForm(request);
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = checkDetailsForm(request);
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('has a submit button', async () => {
    const form = checkDetailsForm(request);
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});
