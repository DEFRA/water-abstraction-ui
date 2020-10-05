'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/season');
const { findField, findButton } = require('../../../../../lib/form-test');
const { SEASONS } = require('../../../../../../src/internal/modules/charge-information/lib/charge-elements/constants');
const { capitalize } = require('lodash');
const createRequest = chargeElementData => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  params: {
    licenceId: 'test-licence-id',
    elementId: 'test-element-id'
  },
  pre: {
    draftChargeInformation: {
      chargeElements: [{
        id: 'test-element-id',
        abstractionPeriod: {
          startDay: 1,
          startMonth: 4,
          endDay: 31,
          endMonth: 6 },
        ...chargeElementData
      }]
    }
  }
});

experiment('internal/modules/charge-information/forms/charge-element/season', () => {
  let seasonForm;

  beforeEach(async () => {
    seasonForm = form(createRequest());
  });

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(seasonForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(seasonForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(seasonForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a 4 choices high, medium, low, very low and low has the hint', async () => {
      const radio = findField(seasonForm, 'season');
      const seasonValues = Object.values(radio.options.choices).map(season => season.value);
      const seasonLabels = Object.values(radio.options.choices).map(season => season.label);
      expect(seasonValues).to.equal(SEASONS);
      expect(seasonLabels).to.equal(SEASONS.map(season => capitalize(season)));
      expect(radio.options.choices[2].hint).to.equal('This is the default season for the abstraction period set');
    });

    test('sets the value of the authorisedAnnualQuantity, if provided', async () => {
      seasonForm = form(createRequest({ season: 'summer' }));
      const seasonField = findField(seasonForm, 'season');
      expect(seasonField.value).to.equal('summer');
    });
  });

  experiment('.schema', () => {
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

    experiment('season', () => {
      SEASONS.forEach(option => {
        test('validates for a string', async () => {
          const result = schema().season.validate(option);
          expect(result.error).to.not.exist();
        });
      });

      test('can not be any other string', async () => {
        const result = schema().season.validate('test');
        expect(result.error).to.exist();
      });
    });
  });
});
