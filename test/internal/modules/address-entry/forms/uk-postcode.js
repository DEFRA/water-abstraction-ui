'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { omit } = require('lodash');
const ukPostcode = require('internal/modules/address-entry/forms/uk-postcode');
const { findField, findButton } = require('../../../../lib/form-test');
const sandbox = require('sinon').createSandbox();

const KEY = 'test-key';

const createRequest = (options = {}) => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    key: KEY
  },
  query: {},
  ...options,
  yar: {
    get: sandbox.stub()
  }
});

experiment('internal/modules/address-entry/forms/uk-postcode', () => {
  experiment('.form', () => {
    test('sets the form method to GET', async () => {
      const form = ukPostcode.form(createRequest());
      expect(form.method).to.equal('get');
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
      expect(field.options.url).to.equal('/address-entry/test-key/manual-entry');
    });

    test('has a submit button', async () => {
      const form = ukPostcode.form(createRequest());
      const button = findButton(form);
      expect(button.options.label).to.equal('Find address');
    });
  });

  experiment('.schema', () => {
    let data;

    beforeEach(async () => {
      data = {
        postcode: 'TT1 1TT'
      };
    });

    test('validates when the data is valid', async () => {
      const { error } = ukPostcode.schema().validate(data);
      expect(error).to.be.null();
    });

    experiment('.postcode validation', () => {
      test('fails if omitted', async () => {
        const { error } = ukPostcode.schema().validate(omit(data, 'postcode'));
        expect(error).to.not.be.null();
      });

      test('fails if not a string', async () => {
        const { error } = ukPostcode.schema().validate({
          ...data,
          postcode: null
        });
        expect(error).to.not.be.null();
      });

      test('fails if not a valid UK postcode', async () => {
        const { error } = ukPostcode.schema().validate({
          ...data,
          postcode: 'X99 X99'
        });
        expect(error).to.not.be.null();
      });
    });
  });
});
