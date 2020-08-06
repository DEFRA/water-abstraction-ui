'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const selectAddress = require('internal/modules/address-entry/forms/select-address');
const { findField, findButton } = require('../../../../lib/form-test');

const addressSearchResults = [{
  address2: '123',
  address3: 'Test Place',
  town: 'Testington',
  postcode: 'TT1 1TT',
  country: 'United Kingdom',
  uprn: 123456
}, {
  address2: '456',
  address3: 'Test Place',
  town: 'Testington',
  postcode: 'TT1 1TT',
  country: 'United Kingdom',
  uprn: 987654
}];

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  yar: {
    get: sandbox.stub().returns({ addressSearchResults })
  }
});

experiment('internal/modules/address-entry/forms/select-address', () => {
  afterEach(() => sandbox.restore());

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const form = selectAddress.form(createRequest());
      expect(form.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const form = selectAddress.form(createRequest());
      const csrf = findField(form, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has an address dropdown field', async () => {
      const form = selectAddress.form(createRequest());
      const dropdown = findField(form, 'uprn');
      expect(dropdown).to.exist();
    });

    test('includes all of the addresses in the dropdown', async () => {
      const form = selectAddress.form(createRequest());
      const { options } = findField(form, 'uprn');
      expect(options.choices[0].label).to.equal('2 addresses found');
      expect(options.choices[1].value).to.equal(addressSearchResults[0].uprn);
      expect(options.choices[2].value).to.equal(addressSearchResults[1].uprn);
    });

    test('sets the uprn value to an integer if supplied', async () => {
      const form = selectAddress.form(createRequest(), '123456');
      const field = findField(form, 'uprn');
      expect(field.value).to.equal(123456);
    });

    test('has a link to the manual address entry page', async () => {
      const form = selectAddress.form(createRequest());
      const field = findField(form, { options: { widget: 'link' } });
      expect(field.options.text).to.equal('I cannot find the address in the list');
      expect(field.options.url).to.equal('/address-entry/manual-entry?country=United Kingdom');
    });

    test('has a submit button', async () => {
      const form = selectAddress.form(createRequest());
      const button = findButton(form);
      expect(button.options.label).to.equal('Continue');
    });
  });

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = selectAddress.schema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = selectAddress.schema.csrf_token.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('uprn', () => {
      test('validates for a string of numbers', async () => {
        const result = selectAddress.schema.uprn.validate('123456');
        expect(result.error).to.be.null();
      });

      test('fails for a string that contains letters', async () => {
        const result = selectAddress.schema.uprn.validate('123abc');
        expect(result.error).to.exist();
      });
    });
  });
});
