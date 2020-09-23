'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/season');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    licenceId: 'test-licence-id'
  }
});

const sessionData = {
  purposeUse: { id: 'test-purpose-use-id' },
  abstractionPeriod: { startDay: 1, startMonth: 4, endDay: 31, endMonth: 6 }
};

experiment('internal/modules/charge-information/forms/charge-element/season', () => {
  let seasonForm;

  beforeEach(async () => {
    seasonForm = form(createRequest(), sessionData);
  });

  experiment('form', () => {
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
      expect(radio.options.choices.length).to.equal(3);
      expect(radio.options.choices[0].label).to.equal('Summer');
      expect(radio.options.choices[1].label).to.equal('Winter');
      expect(radio.options.choices[2].label).to.equal('All year');
      expect(radio.options.choices[2].hint).to.equal('This is the default season for the abstraction period set');
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

    experiment('season', () => {
      const validSeasonOptions = ['summer', 'winter', 'all year'];
      validSeasonOptions.forEach(option => {
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
