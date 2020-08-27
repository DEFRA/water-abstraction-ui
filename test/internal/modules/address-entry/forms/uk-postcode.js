'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const ukPostcode = require('internal/modules/address-entry/forms/uk-postcode');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = (options = {}) => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  ...options
});

experiment('internal/modules/address-entry/forms/uk-postcode', () => {
  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const form = ukPostcode.form(createRequest());
      expect(form.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const form = ukPostcode.form(createRequest());
      const csrf = findField(form, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a postcode field', async () => {
      const form = ukPostcode.form(createRequest());
      const field = findField(form, 'postcode');
      expect(field).to.exist();
    });

    test('sets the postcode value if supplied in the payload', async () => {
      const form = ukPostcode.form(createRequest({ payload: { postcode: 'TT1 1TT' } }));
      const field = findField(form, 'postcode');
      expect(field.value).to.equal('TT1 1TT');
    });

    test('sets the postcode value if supplied in the query', async () => {
      const form = ukPostcode.form(createRequest({ query: { postcode: 'TT1 1TT' } }));
      const field = findField(form, 'postcode');
      expect(field.value).to.equal('TT1 1TT');
    });

    test('has a link to the manual address entry page', async () => {
      const form = ukPostcode.form(createRequest());
      const field = findField(form, { options: { widget: 'link' } });
      expect(field.options.text).to.equal('This address is outside the UK');
      expect(field.options.url).to.equal('/address-entry/manual-entry');
    });

    test('has a submit button', async () => {
      const form = ukPostcode.form(createRequest());
      const button = findButton(form);
      expect(button.options.label).to.equal('Find address');
    });
  });

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = ukPostcode.schema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = ukPostcode.schema.csrf_token.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('postcode', () => {
      test('validates for a valid postcode', async () => {
        const result = ukPostcode.schema.postcode.validate('TT1 1TT');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not valid postcode', async () => {
        const result = ukPostcode.schema.postcode.validate('123abc');
        expect(result.error).to.exist();
      });
    });
  });
});
