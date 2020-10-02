'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form } = require('../../../../../src/internal/modules/charge-information/forms/cancel-charge-info');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    licenceId: 'test-licence-id'
  }
});

experiment('internal/modules/charge-information/forms/cancel-charge-info', () => {
  let cancelChargeInfoForm;

  beforeEach(async () => {
    cancelChargeInfoForm = form(createRequest());
  });

  experiment('form', () => {
    test('sets the form method to POST', async () => {
      expect(cancelChargeInfoForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(cancelChargeInfoForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(cancelChargeInfoForm);
      expect(button.options.label).to.equal('Cancel');
    });
  });
});
