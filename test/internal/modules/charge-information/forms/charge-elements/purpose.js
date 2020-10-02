'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/purpose');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    licenceId: 'test-licence-id'
  },
  pre: {
    defaultCharges: [
      { purposeUse: { id: 'test-id', name: 'test-purpose-name' } },
      { purposeUse: { id: 'test-id', name: 'test-purpose-name' } }
    ],
    licence: { id: 'test-licence-id' }
  }
});

const data = {
  sessionData: {}
};

experiment('internal/modules/charge-information/forms/charge-element/purpose', () => {
  let purposeForm;

  beforeEach(async () => {
    purposeForm = form(createRequest(), data);
  });

  experiment('form', () => {
    test('sets the form method to POST', async () => {
      expect(purposeForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(purposeForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(purposeForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a choice for using abstraction data', async () => {
      const radio = findField(purposeForm, 'purpose');

      expect(radio.options.choices[0].label).to.equal('test-purpose-name');
      expect(radio.options.choices.length).to.equal(1);
    });
  });

  experiment('schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('sciccors');
        expect(result.error).to.exist();
      });
    });

    experiment('purpose', () => {
      test('validates for a uuid', async () => {
        const result = schema().purpose.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.not.exist();
      });

      test('can not be a nomral string', async () => {
        const result = schema().purpose.validate('not-a-uuid');
        expect(result.error).to.exist();
      });
    });
  });
});
