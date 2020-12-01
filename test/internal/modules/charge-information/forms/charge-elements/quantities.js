'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/quantities');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = chargeElements => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
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

experiment('internal/modules/charge-information/forms/charge-element/quantities', () => {
  let quantitiesForm;

  beforeEach(async () => {
    quantitiesForm = form(createRequest());
  });

  experiment('.form', () => {
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

    test('sets the value of the authorisedAnnualQuantity, if provided', async () => {
      quantitiesForm = form(createRequest([{
        id: 'test-element-id',
        authorisedAnnualQuantity: 234
      }]));
      const quantityField = findField(quantitiesForm, 'authorisedAnnualQuantity');
      expect(quantityField.value).to.equal(234);
    });

    test('sets the value of the billableAnnualQuantity, if provided', async () => {
      quantitiesForm = form(createRequest([{
        id: 'test-element-id',
        billableAnnualQuantity: 123
      }]));
      const quantityField = findField(quantitiesForm, 'billableAnnualQuantity');
      expect(quantityField.value).to.equal(123);
    });
  });

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('scissors');
        expect(result.error).to.exist();
      });
    });

    experiment('authorisedAnnualQuantity', () => {
      test('validates for a number string', async () => {
        const result = schema().authorisedAnnualQuantity.validate('132');
        expect(result.error).to.not.exist();
      });

      test('validates for a number string with 6 decimal places', async () => {
        const result = schema().authorisedAnnualQuantity.validate('132.123456');
        expect(result.error).to.not.exist();
      });

      test('must not have more than 6 decimal places', async () => {
        const result = schema().authorisedAnnualQuantity.validate('132.1234567');
        expect(result.error).to.exist();
      });

      test('must not be zero', async () => {
        const result = schema().authorisedAnnualQuantity.validate('0');
        expect(result.error).to.exist();
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
        const result = schema().billableAnnualQuantity.validate('123');
        expect(result.error).to.not.exist();
      });

      test('can be empty', async () => {
        const result = schema().billableAnnualQuantity.validate('');
        expect(result.error).not.to.exist();
      });
    });
  });
});
