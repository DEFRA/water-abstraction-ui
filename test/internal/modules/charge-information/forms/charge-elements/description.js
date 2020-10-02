'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/description');
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

experiment('internal/modules/charge-information/forms/charge-element/description', () => {
  let descriptionForm;

  beforeEach(async () => {
    descriptionForm = form(createRequest(), sessionData);
  });

  experiment('form', () => {
    test('sets the form method to POST', async () => {
      expect(descriptionForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(descriptionForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(descriptionForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a choice for using abstraction data', async () => {
      const text = findField(descriptionForm, 'description');
      expect(text.options.label).to.equal('');
      expect(text.options.hint).to.equal('For example, describe where the abstraction point is');
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

    experiment('description', () => {
      test('validates for a string', async () => {
        const result = schema().description.validate('test description');
        expect(result.error).to.not.exist();
      });

      test('can not null or empty', async () => {
        const result = schema().description.validate('');
        expect(result.error).to.exist();
      });
    });
  });
});
