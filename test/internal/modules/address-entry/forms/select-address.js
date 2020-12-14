'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  afterEach,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');
const { omit } = require('lodash');

const selectAddress = require('internal/modules/address-entry/forms/select-address');
const { findField, findButton } = require('../../../../lib/form-test');

const KEY = 'test-key';

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

const createRequest = (query = {}) => ({
  view: {
    csrfToken: 'token'
  },
  query,
  params: {
    key: KEY
  },
  pre: { addressSearchResults }
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

    test('sets the uprn value to an integer if provided', async () => {
      const form = selectAddress.form(createRequest(), '123456');
      const field = findField(form, 'uprn');
      expect(field.value).to.equal(123456);
    });

    test('has a link to the manual address entry page', async () => {
      const form = selectAddress.form(createRequest({ postcode: 'TT1 1TT' }));
      const field = findField(form, { options: { widget: 'link' } });
      expect(field.options.text).to.equal('I cannot find the address in the list');
      expect(field.options.url).to.equal('/address-entry/test-key/manual-entry?country=United%20Kingdom&postcode=TT1%201TT');
    });

    test('has hidden postcode field', async () => {
      const form = selectAddress.form(createRequest());
      const postcode = findField(form, 'postcode');
      expect(postcode.options.type).to.equal('hidden');
    });

    test('sets the postcode value if provided', async () => {
      const form = selectAddress.form(createRequest({ postcode: 'TT1 1TT' }));
      const postcode = findField(form, 'postcode');
      expect(postcode.value).to.equal('TT1 1TT');
    });

    test('has a submit button', async () => {
      const form = selectAddress.form(createRequest());
      const button = findButton(form);
      expect(button.options.label).to.equal('Continue');
    });
  });

  experiment('.schema', () => {
    let data, request;

    beforeEach(async () => {
      data = {
        csrf_token: uuid(),
        uprn: 123,
        postcode: 'TT1 1TT'
      };
      request = {
        pre: {
          addressSearchResults: [{
            uprn: 123
          }, {
            uprn: 456
          }]
        }
      };
    });

    test('validates when the data is valid', async () => {
      const { error } = selectAddress.schema(request).validate(data);
      expect(error).to.be.null();
    });

    experiment('.csrf_token validation', () => {
      test('fails if omitted', async () => {
        const { error } = selectAddress.schema(request).validate(omit(data, 'csrf_token'));
        expect(error).to.not.be.null();
      });

      test('fails if not a guid', async () => {
        const { error } = selectAddress.schema(request).validate({
          ...data,
          csrf_token: 'not-a-guid'
        });
        expect(error).to.not.be.null();
      });
    });

    experiment('.uprn validation', () => {
      test('fails if omitted', async () => {
        const { error } = selectAddress.schema(request).validate(omit(data, 'uprn'));
        expect(error).to.not.be.null();
      });

      test('fails if not a number', async () => {
        const { error } = selectAddress.schema(request).validate({
          ...data,
          uprn: null
        });
        expect(error).to.not.be.null();
      });

      test('fails if not one of the address search results defined in request.pre', async () => {
        const { error } = selectAddress.schema(request).validate({
          ...data,
          uprn: 999
        });
        expect(error).to.not.be.null();
      });
    });

    experiment('.postcode validation', () => {
      test('fails if omitted', async () => {
        const { error } = selectAddress.schema(request).validate(omit(data, 'postcode'));
        expect(error).to.not.be.null();
      });

      test('fails if not a string', async () => {
        const { error } = selectAddress.schema(request).validate({
          ...data,
          postcode: null
        });
        expect(error).to.not.be.null();
      });

      test('fails if not a valid UK postcode', async () => {
        const { error } = selectAddress.schema(request).validate({
          ...data,
          postcode: 'X99 X99'
        });
        expect(error).to.not.be.null();
      });
    });
  });
});
