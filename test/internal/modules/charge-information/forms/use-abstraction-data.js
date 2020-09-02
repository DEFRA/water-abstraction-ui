'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('internal/modules/charge-information/forms/use-abstraction-data');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  pre: {
    licence: {
      id: 'test-licence-id'
    },
    draftChargeInformation: {}
  }
});

experiment('internal/modules/charge-information/forms/use-abstraction-data', () => {
  experiment('form', () => {
    test('sets the form method to POST', async () => {
      const abstractionForm = form(createRequest());
      expect(abstractionForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const abstractionForm = form(createRequest());
      const csrf = findField(abstractionForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const abstractionForm = form(createRequest());
      const button = findButton(abstractionForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a choice for using abstraction data', async () => {
      const abstractionForm = form(createRequest());
      const radio = findField(abstractionForm, 'useAbstractionData');

      expect(radio.options.choices[0].label).to.equal('Yes');
      expect(radio.options.choices[1].label).to.equal('No');
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

    experiment('useAbstractionData', () => {
      test('can be true', async () => {
        const result = schema().useAbstractionData.validate(true);
        expect(result.error).to.not.exist();
      });

      test('can be true', async () => {
        const result = schema().useAbstractionData.validate(false);
        expect(result.error).to.not.exist();
      });

      test('cannot be a unexpected string be true', async () => {
        const result = schema().useAbstractionData.validate('pizza');
        expect(result.error).to.exist();
      });
    });
  });
});
