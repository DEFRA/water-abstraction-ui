'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const {
  form,
  schema
} = require('../../../../../../src/internal/modules/charge-information/forms/charge-category/adjustments');
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

experiment('internal/modules/charge-information/forms/charge-category/adjustments', () => {
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

    test('has a submit button', async () => {
      const adjustmentCheckBoxes = findField(formResponse, 'adjustments');
      expect(adjustmentCheckBoxes.options.widget).to.equal('checkbox');
      expect(adjustmentCheckBoxes.options.mapper).to.equal('arrayMapper');
      expect(adjustmentCheckBoxes.options.choices[0].label).to.equal('Aggregate');
      expect(adjustmentCheckBoxes.options.choices[0].fields[0].name).to.equal('aggregateFactor');
      expect(adjustmentCheckBoxes.options.choices[1].label).to.equal('Charge adjustment');
      expect(adjustmentCheckBoxes.options.choices[1].fields[0].name).to.equal('chargeFactor');
      expect(adjustmentCheckBoxes.options.choices[2].label).to.equal('Winter discount');
      expect(adjustmentCheckBoxes.options.choices[3].label).to.equal('Two-part tariff agreement');
      expect(adjustmentCheckBoxes.options.choices[4].label).to.equal('Abatement agreement');
      expect(adjustmentCheckBoxes.options.choices[4].fields[0].name).to.equal('s126Factor');
      expect(adjustmentCheckBoxes.options.choices[5].label).to.equal('Canal and River Trust agreement');
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
          adjustments: ['winter']
        }, { allowUnknown: true });
        expect(result.error).to.be.undefined();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          asjustments: ['winter']
        }, { allowUnknown: true });
        expect(result.error).to.exist();
      });
    });
    experiment('adjustments', () => {
      test('validates for an array with valid options when no factors are applied', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          adjustments: ['winter', 's127']
        }, { allowUnknown: true });
        expect(result.error).to.be.undefined();
      });

      test('validates when a aggregate factor is ticked and a valid factor is added', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          adjustments: ['winter', 's127', 'aggregate'],
          aggregateFactor: 0.5
        }, { allowUnknown: true });
        expect(result.error).to.be.undefined();
      });

      test('fails when a aggregate factor is ticked and a factor is not provided', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          adjustments: ['winter', 's127', 'aggregate'],
          aggregateFactor: ''
        }, { allowUnknown: true });
        expect(result.error).to.exist();
      });
      test('fails when a aggregate factor is ticked and a factor is not less than 1', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          adjustments: ['winter', 's127', 'aggregate'],
          aggregateFactor: '1'
        }, { allowUnknown: true });
        expect(result.error).to.exist();
      });
      test('fails when a aggregate factor is ticked and a factor is not greater than 0', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          adjustments: ['winter', 's127', 'aggregate'],
          aggregateFactor: '-1'
        }, { allowUnknown: true });
        expect(result.error).to.exist();
      });
      test('fails when a aggregate factor is ticked and a factor is equal to 0', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          adjustments: ['winter', 's127', 'aggregate'],
          aggregateFactor: '0'
        }, { allowUnknown: true });
        expect(result.error).to.exist();
      });
    });
  });
});
