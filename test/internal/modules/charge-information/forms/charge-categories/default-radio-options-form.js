'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { SOURCES } = require('../../../../../../src/internal/modules/charge-information/lib/charge-categories/constants');
const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-category/default-radio-options-form');
const { findField, findButton } = require('../../../../../lib/form-test');
const { capitalize } = require('lodash');

const createRequest = chargeElements => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  pre: {
    draftChargeInformation: {
      chargeElements
    }
  },
  params: {
    elementId: 'test-category-id',
    step: 'source'
  }
});

experiment('internal/modules/charge-information/forms/charge-element/loss-category', () => {
  let chargeCategoryForm;

  beforeEach(async () => {
    chargeCategoryForm = form(createRequest([{ id: 'test-category-id', description: 'Test description' }]));
  });

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(chargeCategoryForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(chargeCategoryForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(chargeCategoryForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has the correct choices Tidal and Non-Tidal', async () => {
      const radio = findField(chargeCategoryForm, 'source');
      const lossCategoryValues = Object.values(radio.options.choices).map(choice => choice.value);
      const lossCategoryLabels = Object.values(radio.options.choices).map(choice => choice.label);
      expect(lossCategoryValues).to.equal(Object.values(SOURCES));
      expect(lossCategoryLabels).to.equal(Object.values(SOURCES).map(choice => capitalize(choice)));
    });

    test('sets the value of the source field, if provided', async () => {
      chargeCategoryForm = form(createRequest([{ id: 'test-category-id', source: 'Tidal' }]));
      const source = findField(chargeCategoryForm, 'source');
      expect(source.value).to.equal('Tidal');
    });
  });

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest([])).validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', source: Object.values(SOURCES)[0] });
        expect(result.error).to.be.undefined();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest([])).validate({ csrf_token: 'sciccors', source: Object.values(SOURCES)[0] });
        expect(result.error).to.exist();
      });
    });

    experiment('source', () => {
      Object.values(SOURCES).forEach(option => {
        test('validates for a string', async () => {
          const result = schema(createRequest([])).validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', source: option });
          expect(result.error).to.not.exist();
        });
      });

      test('can not be any other string', async () => {
        const result = schema(createRequest([])).validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', source: 'test' });
        expect(result.error).to.exist();
      });
    });
  });
});
