'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const manualAddressEntry = require('internal/modules/address-entry/forms/manual-address-entry');
const { findField, findButton } = require('../../../../lib/form-test');

const csrfToken = 'c5afe238-fb77-4131-be80-384aaf245842';
const address = {
  addressLine1: 'Test House',
  addressLine2: '123',
  addressLine3: 'Test Place',
  addressLine4: 'Test Place',
  town: 'Testington',
  county: 'Testingshire',
  postcode: 'TT1 1TT',
  country: 'United Kingdom'
};

const createRequest = (query = {}) => ({
  view: {
    csrfToken
  },
  query
});

experiment('internal/modules/address-entry/forms/manual-address-entry', () => {
  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const form = manualAddressEntry.form(createRequest());
      expect(form.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const form = manualAddressEntry.form(createRequest());
      const csrf = findField(form, 'csrf_token');
      expect(csrf.value).to.equal(csrfToken);
    });

    Object.keys(address).forEach(fieldName => {
      const form = manualAddressEntry.form(createRequest(), address);
      const field = findField(form, fieldName);

      test(`has a/an ${fieldName} field`, async () => {
        expect(field).to.exist();
      });

      test(`sets the ${fieldName} value if supplied`, async () => {
        expect(field.value).to.equal(address[fieldName]);
      });
    });

    test('sets the country value from the request when present', async () => {
      const form = manualAddressEntry.form(createRequest({ country: 'United Kingdom' }));
      const field = findField(form, 'country');
      expect(field.value).to.equal('United Kingdom');
    });

    test('has a hidden data source field set to "wrls"', async () => {
      const form = manualAddressEntry.form(createRequest());
      const field = findField(form, 'dataSource');
      expect(field.value).to.equal('wrls');
      expect(field.options.type).to.equal('hidden');
    });

    test('has a hidden uprn field set to null', async () => {
      const form = manualAddressEntry.form(createRequest());
      const field = findField(form, 'uprn');
      expect(field.value).to.equal(null);
      expect(field.options.type).to.equal('hidden');
    });

    test('sets the uprn field to null even when a value is provided', async () => {
      const form = manualAddressEntry.form(createRequest(), { uprn: '1234' });
      const field = findField(form, 'uprn');
      expect(field.value).to.equal(null);
    });

    test('has a submit button', async () => {
      const form = manualAddressEntry.form(createRequest());
      const button = findButton(form);
      expect(button.options.label).to.equal('Continue');
    });
  });

  experiment('.schema', () => {
    let address;

    beforeEach(async () => {
      address = {
        addressLine1: 'Flat 123',
        addressLine2: '456',
        addressLine3: 'Testing House',
        addressLine4: 'Testing Street',
        town: 'Testington',
        county: 'Testingshire',
        postcode: 'TT1 1TT',
        country: 'United Kingdom',
        csrf_token: csrfToken
      };
    });

    test('validates for a valid address and csrf token', async () => {
      const { error } = manualAddressEntry.schema.validate(address);
      expect(error).to.be.null();
    });

    test('fails validation for a valid address and invalid csrf token', async () => {
      address.csrf_token = 'not-a-guid';
      const { error } = manualAddressEntry.schema.validate(address);
      expect(error).to.not.be.null();
    });

    test('fails validation for an invalid address and valid csrf token', async () => {
      address.postcode = 'XXX XXX';
      const { error } = manualAddressEntry.schema.validate(address);
      expect(error).to.not.be.null();
    });
  });
});
