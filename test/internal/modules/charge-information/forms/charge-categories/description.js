'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const {
  form,
  schema
} = require('../../../../../../src/internal/modules/charge-information/forms/charge-category/description');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = chargeElements => ({
  view: {
    csrfToken: 'token'
  },
  query: {
    categoryId: ''
  },
  params: {
    licenceId: 'test-licence-id',
    elementId: 'test-element-id'
  },
  pre: {
    draftChargeInformation: {
      chargeElements: chargeElements || []
    }
  }
});

experiment('internal/modules/charge-information/forms/charge-category/description', () => {
  let formResponse;

  beforeEach(async () => {
    formResponse = form(createRequest());
  });

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(formResponse.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(formResponse, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a continue button', async () => {
      const descriptionField = findField(formResponse, 'description');
      expect(descriptionField.options.widget).to.equal('text');
      expect(descriptionField.options.type).to.equal('text');
      expect(descriptionField.options.hint).to.equal('This is the description that will appear on the invoice');
      expect(descriptionField.options.errors['string.empty'].message).to.equal('Enter a description for the charge reference');
      expect(descriptionField.options.errors['any.required'].message).to.equal('Enter a description for the charge reference');
      expect(descriptionField.options.errors['string.pattern.base'].message).to.equal('You can only include letters, numbers, hyphens, the and symbol (&) and brackets. The description must be less than 181 characters');
    });

    test('has a submit button', async () => {
      const button = findButton(formResponse);
      expect(button.options.label).to.equal('Continue');
    });
  });

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: 'fake desc'
        }, { allowUnknown: true });
        expect(result.error).to.be.undefined();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          description: 'fake desc'
        }, { allowUnknown: true });
        expect(result.error).to.exist();
      });
    });
    experiment('description', () => {
      test('successful description', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: 'I am a - test of 123 and less than 180 chars'
        }, { allowUnknown: true });
        expect(result.value.description).to.equal('I am a - test of 123 and less than 180 chars');
      });
      test('validates for a empty description', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: ''
        }, { allowUnknown: true });
        expect(result.error).to.be.an.instanceof(Error);
        expect(result.error.message).to.equal('"description" is not allowed to be empty');
      });
      test('validates for the descriptionRegex - includes nto allowed @', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: '@'
        }, { allowUnknown: true });
        expect(result.error).to.be.an.instanceof(Error);
        expect(result.error.message).to.equal('"description" with value "@" fails to match the required pattern: /^[a-zA-Z/s 0-9-\'.,()&*]{1,180}$/');
      });
      test('validates for the descriptionRegex - bigger than 180 chars', async () => {
        const stringBiggerThan180Chars = 'w5OyHN3NWsL9KTKU7afHDMlN1FUzzV3Fj30ci1sr9z1RK1jPxuOv6rFa9yb6tzGvZ6i5uaRF73V5FgwATfN08kdeYisXysk7gc90s1IVI2uyji04Tw8H1ij1o0tAh22r99C8aupphswIQt2I9CBNFhZr4rxaS413lFIb05BrQQ5OQPYVei3k4H6jEKfjCvW1iCMtReZYKE64C6EA9fGjUMrt2wNFKnoQoXo3A66yIS5iCJhV8g94fWEYzI8ZfozqWLR15Sg92HQQsT6Nr37uUFr3zIy79t0pDvcp75Ctq87Dx4eRLNHBTjzB';
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: stringBiggerThan180Chars
        }, { allowUnknown: true });
        expect(result.error).to.be.an.instanceof(Error);
        expect(result.error.message).to.equal(`"description" with value "${stringBiggerThan180Chars}" fails to match the required pattern: /^[a-zA-Z/s 0-9-'.,()&*]{1,180}$/`);
      });
    });
  });
});
