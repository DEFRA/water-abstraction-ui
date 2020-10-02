'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('internal/modules/charge-information/forms/billing-account');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = draftChargeInformation => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  pre: {
    licence: {
      id: 'test-licence-id'
    },
    draftChargeInformation,
    billingAccounts: [
      {
        id: '00000000-0000-0000-0000-000000001111',
        invoiceAccountAddresses: [
          {
            id: '00000000-0000-0000-0000-000000002222',
            invoiceAccountId: '00000000-0000-0000-0000-000000001111',
            address: {
              id: '00000000-0000-0000-0000-00000000333',
              addressLine1: 'test 1',
              addressLine2: 'test 2',
              addressLine3: null,
              addressLine4: null,
              town: 'test town',
              county: 'test county',
              postcode: 'AB1 1AB',
              country: null
            }
          }
        ],
        accountNumber: 'A00000000A',
        company: {
          id: '00000000-0000-0000-0000-000000003333',
          name: 'Test Company Name',
          type: 'organisation'
        }
      }
    ]
  }
});

experiment('internal/modules/charge-information/forms/use-abstraction-data', () => {
  experiment('form', () => {
    let abstractionForm;
    beforeEach(() => {
      abstractionForm = form(createRequest());
    });
    test('sets the form method to POST', async () => {
      expect(abstractionForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(abstractionForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(abstractionForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a choice for selecting an existing account', async () => {
      const radio = findField(abstractionForm, 'invoiceAccountAddress');

      expect(radio.options.choices[0].html).to.equal('A00000000A - Test Company Name<br>test 1, test 2, test town, test county, AB1 1AB');
      expect(radio.options.choices[0].value).to.equal('00000000-0000-0000-0000-000000002222');
    });

    test('has a choice for creating a new account', async () => {
      const abstractionForm = form(createRequest());
      const radio = findField(abstractionForm, 'invoiceAccountAddress');

      expect(radio.options.choices[2].label).to.equal('Set up a new billing account');
      expect(radio.options.choices[2].value).to.equal('set-up-new-billing-account');
    });

    test('sets the value of the invoiceAccountAddress, if provided', async () => {
      abstractionForm = form(createRequest({
        invoiceAccount: {
          invoiceAccountAddress: '00000000-0000-0000-0000-000000002222'
        }
      }));
      const radio = findField(abstractionForm, 'invoiceAccountAddress');
      expect(radio.value).to.equal('00000000-0000-0000-0000-000000002222');
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

    experiment('invoiceAccountAddress', () => {
      test('can be set-up-new-billing-account', async () => {
        const request = createRequest();
        const result = schema(request).invoiceAccountAddress.validate('set-up-new-billing-account');
        expect(result.error).to.not.exist();
      });

      test('can be an invoice account address id', async () => {
        const request = createRequest();
        const result = schema(request).invoiceAccountAddress.validate('00000000-0000-0000-0000-000000002222');
        expect(result.error).to.not.exist();
      });

      test('cannot be a unexpected string be true', async () => {
        const request = createRequest();
        const result = schema(request).invoiceAccountAddress.validate('pizza');
        expect(result.error).to.exist();
      });
    });
  });
});
