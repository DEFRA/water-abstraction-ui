'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const Joi = require('@hapi/joi');

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
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = manualAddressEntry.schema.csrf_token.validate(csrfToken);
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = manualAddressEntry.schema.csrf_token.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    ['addressLine1',
      'addressLine2',
      'addressLine3',
      'addressLine4',
      'town',
      'county'
    ].forEach(fieldName => {
      experiment(fieldName, () => {
        test('validates for a string', async () => {
          const result = manualAddressEntry.schema[fieldName].validate(address[fieldName]);
          expect(result.error).to.be.null();
        });

        test('is optional - validates for an empty string', async () => {
          const result = manualAddressEntry.schema[fieldName].validate('');
          expect(result.error).to.be.null();
        });
      });
    });

    experiment('postcode', () => {
      test('validates for a valid postcode', async () => {
        const result = manualAddressEntry.schema.postcode.validate('TT1 1TT');
        expect(result.error).to.be.null();
      });

      test('is optional when country is not "United Kingdom"', async () => {
        const addressData = {
          csrf_token: csrfToken,
          ...address,
          postcode: '',
          country: 'British Virgin Islands',
          dataSource: 'wrls',
          uprn: ''
        };
        const result = Joi.validate(addressData, manualAddressEntry.schema);
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not valid postcode', async () => {
        const result = manualAddressEntry.schema.postcode.validate('123abc');
        expect(result.error).to.exist();
      });
    });

    experiment('country', () => {
      test('validates for a valid country', async () => {
        const result = manualAddressEntry.schema.country.validate('United Kingdom');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not valid country', async () => {
        const result = manualAddressEntry.schema.country.validate('Fakeland');
        expect(result.error).to.exist();
      });
    });

    experiment('dataSource', () => {
      test('validates for "wlrs"', async () => {
        const result = manualAddressEntry.schema.dataSource.validate('wrls');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not equal to "wrls"', async () => {
        const result = manualAddressEntry.schema.dataSource.validate('nald');
        expect(result.error).to.exist();
      });
    });
  });

  experiment('.applyRequiredFieldErrors', () => {
    let form;
    beforeEach(() => {
      const request = createRequest();
      form = manualAddressEntry.form(request, address);
      form.errors = [{
        name: 'testError',
        message: 'test error',
        summary: 'test error'
      }];
    });

    experiment('does not apply errors when', () => {
      test('all address fields have values', async () => {
        const result = manualAddressEntry.applyRequiredFieldErrors(form, address);
        expect(result).to.equal(form);
      });

      test('addressLine2 has a value, addressLine3 does not have a value', async () => {
        const addressData = {
          ...address,
          addressLine3: ''
        };
        const result = manualAddressEntry.applyRequiredFieldErrors(form, addressData);
        expect(result).to.equal(form);
      });

      test('addressLine3 has a value, addressLine2 does not have a value', async () => {
        const addressData = {
          ...address,
          addressLine2: ''
        };
        const result = manualAddressEntry.applyRequiredFieldErrors(form, addressData);
        expect(result).to.equal(form);
      });

      test('addressLine4 has a value, town does not have a value', async () => {
        const addressData = {
          ...address,
          town: ''
        };
        const result = manualAddressEntry.applyRequiredFieldErrors(form, addressData);
        expect(result).to.equal(form);
      });

      test('town has a value, addressLine4 does not have a value', async () => {
        const addressData = {
          ...address,
          addressLine4: ''
        };
        const result = manualAddressEntry.applyRequiredFieldErrors(form, addressData);
        expect(result).to.equal(form);
      });
    });

    experiment('applies new errors when', () => {
      test('addressLine2 and addressLine3 do not have a value', async () => {
        const addressData = {
          ...address,
          addressLine2: '',
          addressLine3: ''
        };
        const result = manualAddressEntry.applyRequiredFieldErrors(form, addressData);
        expect(result.errors).to.have.length(2);
        expect(result.errors[0].name).to.equal('addressLine2');
        expect(result.errors[0].message).to.equal('Enter either a building number or building name');
        expect(result.errors[0].summary).to.equal('Enter either a building number or building name');
      });

      test('addressLine4 and town do not have a value', async () => {
        const addressData = {
          ...address,
          addressLine4: '',
          town: ''
        };
        const result = manualAddressEntry.applyRequiredFieldErrors(form, addressData);
        expect(result.errors).to.have.length(2);
        expect(result.errors[0].name).to.equal('addressLine4');
        expect(result.errors[0].message).to.equal('Enter either a street name or town or city');
        expect(result.errors[0].summary).to.equal('Enter either a street name or town or city');
      });
    });
  });
});
