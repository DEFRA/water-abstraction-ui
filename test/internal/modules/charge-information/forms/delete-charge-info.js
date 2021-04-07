'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form } = require('../../../../../src/internal/modules/charge-information/forms/delete-charge-info');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    licenceId: 'test-licence-id',
    chargeVersionWorkflowId: 'test-charge-version-workflow-id'
  }
});

experiment('internal/modules/charge-information/forms/cancel-charge-info', () => {
  let request, cancelChargeInfoForm;

  experiment('.form', () => {
    experiment('default behaviour', () => {
      beforeEach(async () => {
        request = createRequest();
        cancelChargeInfoForm = form(request);
      });

      test('sets the form method to POST', async () => {
        expect(cancelChargeInfoForm.method).to.equal('POST');
      });

      test('sets the expected form action', async () => {
        expect(cancelChargeInfoForm.action).to.equal(
          `/licences/${request.params.licenceId}/charge-information/cancel`
        );
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

    experiment('when isCancelData is false', () => {
      beforeEach(async () => {
        request = createRequest();
        cancelChargeInfoForm = form(request, false);
      });

      test('sets the expected form action', async () => {
        expect(cancelChargeInfoForm.action).to.equal(
          `/charge-information-workflow/${request.params.chargeVersionWorkflowId}/remove`
        );
      });

      test('has a submit button', async () => {
        const button = findButton(cancelChargeInfoForm);
        expect(button.options.label).to.equal('Remove');
      });
    });
  });
});
