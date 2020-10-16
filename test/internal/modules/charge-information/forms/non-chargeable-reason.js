'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('internal/modules/charge-information/forms/non-chargeable-reason');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  query: {
    returnToCheckData: 0
  },
  pre: {
    licence: {
      id: 'test-licence-id'
    },
    changeReasons: [
      { id: 'test-id-1', description: 'test-desc-1' },
      { id: 'test-id-2', description: 'test-desc-2' }
    ],
    draftChargeInformation: {}
  }
});

experiment('internal/modules/charge-information/forms/non-chargeable-reason', () => {
  experiment('form', () => {
    test('sets the form method to POST', async () => {
      const nonChargeableForm = form(createRequest());
      expect(nonChargeableForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const nonChargeableForm = form(createRequest());
      const csrf = findField(nonChargeableForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const nonChargeableForm = form(createRequest());
      const button = findButton(nonChargeableForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a choices for the non chargeable reasons', async () => {
      const nonChargeableForm = form(createRequest());
      const radio = findField(nonChargeableForm, 'reason');

      expect(radio.options.choices[0].value).to.equal('test-id-1');
      expect(radio.options.choices[0].label).to.equal('test-desc-1');
      expect(radio.options.choices[1].value).to.equal('test-id-2');
      expect(radio.options.choices[1].label).to.equal('test-desc-2');
    });
  });

  experiment('schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('reason', () => {
      test('can be an id from the pre handler charge reasons', async () => {
        const result = schema(createRequest()).reason.validate('test-id-1');
        expect(result.error).to.not.exist();
      });

      test('cannot be a unexpected string be true', async () => {
        const result = schema(createRequest()).reason.validate('pizza');
        expect(result.error).to.exist();
      });
    });
  });
});
