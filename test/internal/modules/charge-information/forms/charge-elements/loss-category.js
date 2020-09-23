'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/loss-category');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  pre: {
    licence: { id: 'test-licence-id' },
    defaultCharges: [{ purposeUse: { id: 'test-purpose-use-id' }, loss: 'low' }]
  },
  params: {
    elementId: 'test-element-id'
  }
});

const sessionData = { purposeUse: { id: 'test-purpose-use-id' } };

experiment('internal/modules/charge-information/forms/charge-element/loss-category', () => {
  let lossCategoryForm;

  beforeEach(async () => {
    lossCategoryForm = form(createRequest(), sessionData);
  });

  experiment('form', () => {
    test('sets the form method to POST', async () => {
      expect(lossCategoryForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(lossCategoryForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(lossCategoryForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a 4 choices high, medium, low, very low and low has the hint', async () => {
      const radio = findField(lossCategoryForm, 'loss');
      expect(radio.options.choices.length).to.equal(4);
      expect(radio.options.choices[0].label).to.equal('High');
      expect(radio.options.choices[1].label).to.equal('Medium');
      expect(radio.options.choices[2].label).to.equal('Low');
      expect(radio.options.choices[2].hint).to.equal('This is the default loss category for the purpose chosen');
      expect(radio.options.choices[3].label).to.equal('Very low');
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

    experiment('loss', () => {
      const validLossOptions = ['high', 'medium', 'low', 'very low'];
      validLossOptions.forEach(option => {
        test('validates for a string', async () => {
          const result = schema().loss.validate(option);
          expect(result.error).to.not.exist();
        });
      });

      test('can not be any other string', async () => {
        const result = schema().loss.validate('test');
        expect(result.error).to.exist();
      });
    });
  });
});
