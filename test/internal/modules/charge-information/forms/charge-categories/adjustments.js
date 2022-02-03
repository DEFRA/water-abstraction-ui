'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const {
  form,
  schema
} = require('../../../../../../src/internal/modules/charge-information/forms/charge-category/adjustments');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = chargeElements => ({
  view: {
    csrfToken: 'token'
  },
  query: {
    categoryId: ''
  },
  params: {
    licenceId: 'test-licence-id',
    elementId: 'test-element-id'
  },
  pre: {
    draftChargeInformation: {
      chargeElements: chargeElements || []
    }
  }
});

experiment('internal/modules/charge-information/forms/charge-category/adjustments', () => {
  let volumeForm;

  beforeEach(async () => {
    volumeForm = form(createRequest());
  });

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(volumeForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(volumeForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(volumeForm);
      expect(button.options.label).to.equal('Continue');
    });
  });

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          adjustments: ['winter']
        }, { allowUnknown: true });
        expect(result.error).to.be.undefined();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          volume: '1'
        }, { allowUnknown: true });
        expect(result.error).to.exist();
      });
    });
  });
});
