'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/quantities');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    licenceId: 'test-licence-id'
  }
});

const sessionData = {};

experiment('internal/modules/charge-information/forms/charge-element/quantities', () => {
  let quantitiesForm;

  beforeEach(async () => {
    quantitiesForm = form(createRequest(), sessionData);
  });

  experiment('form', () => {
    test('sets the form method to POST', async () => {
      expect(quantitiesForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(quantitiesForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(quantitiesForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a choice for using authorisedAnnualQuantity', async () => {
      const text = findField(quantitiesForm, 'authorisedAnnualQuantity');
      expect(text.options.label).to.equal('Authorised');
    });
    test('has a choice for using billableAnnualQuantity', async () => {
      const text = findField(quantitiesForm, 'billableAnnualQuantity');
      expect(text.options.label).to.equal('Billable (optional)');
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

    experiment('authorisedAnnualQuantity', () => {
      test('validates for a string', async () => {
        const result = schema().authorisedAnnualQuantity.validate(132);
        expect(result.error).to.not.exist();
      });

      test('must be a number', async () => {
        const result = schema().authorisedAnnualQuantity.validate('gsgsd');
        expect(result.error).to.exist();
      });

      test('can not null or empty', async () => {
        const result = schema().authorisedAnnualQuantity.validate('');
        expect(result.error).to.exist();
      });
    });
    experiment('billableAnnualQuantity', () => {
      test('validates for a string', async () => {
        const result = schema().billableAnnualQuantity.validate(123);
        expect(result.error).to.not.exist();
      });

      test('can not null or empty', async () => {
        const result = schema().billableAnnualQuantity.validate('');
        expect(result.error).not.to.exist();
      });
    });
  });
});
