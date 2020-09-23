'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const Joi = require('@hapi/joi');
const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/time-limit');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    licenceId: 'test-licence-id'
  },
  pre: {
    licence: { id: 'test-licence-id', expiredDate: '2020-12-31' },
    draftChargeInformation: { startDate: '2001-01-01' }
  }
});

const testUuid = 'c5afe238-fb77-4131-be80-384aaf245842';

const sessionData = {
  timeLimitedPeriod: false
};

experiment('internal/modules/charge-information/forms/charge-element/time-limited', () => {
  let timeLimitForm;

  beforeEach(async () => {
    timeLimitForm = form(createRequest(), sessionData);
  });

  experiment('form', () => {
    test('sets the form method to POST', async () => {
      expect(timeLimitForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(timeLimitForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(timeLimitForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a choice for using abstraction data', async () => {
      const radio = findField(timeLimitForm, 'timeLimitedPeriod');
      expect(radio.options.choices[0].label).to.equal('Yes');
      expect(radio.options.choices[0].value).to.equal('yes');
      expect(radio.options.choices[0].fields.length).to.equal(2);
      expect(radio.options.choices[0].fields[0].name).to.equal('startDate');
      expect(radio.options.choices[0].fields[0].options.label).to.equal('Enter start date');
      expect(radio.options.choices[0].fields[0].options.widget).to.equal('date');
      expect(radio.options.choices[0].fields[1].name).to.equal('endDate');
      expect(radio.options.choices[0].fields[1].options.label).to.equal('Enter end date');
      expect(radio.options.choices[0].fields[1].options.widget).to.equal('date');
      expect(radio.options.choices[1].label).to.equal('No');
      expect(radio.options.choices[1].value).to.equal('no');
    });
  });

  experiment('schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate(testUuid);
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('sciccors');
        expect(result.error).to.exist();
      });
    });

    experiment('timeLimitedPeriod', () => {
      test('validates yes', async () => {
        const result = schema().timeLimitedPeriod.validate('yes');
        expect(result.error).to.not.exist();
      });
      test('validates no', async () => {
        const result = schema().timeLimitedPeriod.validate('no');
        expect(result.error).to.not.exist();
      });

      test('can not be a nomral string', async () => {
        const result = schema().timeLimitedPeriod.validate('something');
        expect(result.error).to.exist();
      });
    });

    experiment('expiredDate', () => {
      test('validates yes', async () => {
        const result = schema().expiredDate.validate('2001-01-02');
        expect(result.error).to.not.exist();
      });
      test('validates no', async () => {
        const result = schema().expiredDate.validate('2001-t1-sd');
        expect(result.error).to.exist();
      });
    });
    experiment('chargeStartDate', () => {
      test('validates yes', async () => {
        const result = schema().chargeStartDate.validate('2001-01-02');
        expect(result.error).to.not.exist();
      });
      test('validates no', async () => {
        const result = schema().chargeStartDate.validate('2001-t1-sd');
        expect(result.error).to.exist();
      });
    });
    experiment('startDate', () => {
      test('accepts a valid date', async () => {
        const result = schema().startDate.validate('2001-01-02');
        expect(result.error).to.not.exist();
      });
      test('accepts an empty string', async () => {
        const result = schema().startDate.validate('');
        expect(result.error).to.not.exist();
      });
      test('validates no', async () => {
        const result = schema().startDate.validate('2001-t1-sd');
        expect(result.error).to.exist();
      });
      test('is not required if timeLimitedPeriod is no', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'no'
        };
        const result = Joi.validate(data, schema());
        expect(result.error).not.to.exist();
      });
    });
    experiment('endDate', () => {
      test('accepts a valid date', async () => {
        const result = schema().endDate.validate('2001-01-02');
        expect(result.error).to.not.exist();
      });
      test('accepts an empty string', async () => {
        const result = schema().endDate.validate('');
        expect(result.error).to.not.exist();
      });
      test('validates no', async () => {
        const result = schema().endDate.validate('2001-t1-sd');
        expect(result.error).to.exist();
      });
      test('is not required if timeLimitedPeriod is no/false', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'no'
        };
        const result = Joi.validate(data, schema());
        expect(result.error).not.to.exist();
      });
    });
    experiment('when timeLimitedPeriod is yes', () => {
      test('startDate is required', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          expiredDate: '2001-12-31',
          chargeStartDate: '2001-01-01',
          // missing start date
          endDate: '2001-02-28'
        };
        const result = Joi.validate(data, schema());
        expect(result.error).to.exist();
      });
      test('endDate is required', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          expiredDate: '2001-12-31',
          chargeStartDate: '2001-01-01',
          startDate: '2001-02-28'
          // missing endDate
        };
        const result = Joi.validate(data, schema());
        expect(result.error).to.exist();
      });
      test('accepts start and end dates', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          expiredDate: '2001-12-31',
          chargeStartDate: '2001-01-01',
          startDate: '2001-01-02',
          endDate: '2001-02-08'
        };
        const result = Joi.validate(data, schema());
        expect(result.error).not.to.exist();
      });
      test('fails when startDate is before chargeStartDate', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          expiredDate: '2001-12-31',
          chargeStartDate: '2001-01-01',
          startDate: '2000-01-02',
          endDate: '2001-02-08'
        };
        const result = Joi.validate(data, schema());
        expect(result.error).to.exist();
      });
      test('fails when endDate is after expiredDate', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          expiredDate: '2001-12-31',
          chargeStartDate: '2001-01-01',
          startDate: '2001-01-02',
          endDate: '2002-02-08'
        };
        const result = Joi.validate(data, schema());
        expect(result.error).to.exist();
      });
      test('is OK when start and end dates are on the boundaries', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          expiredDate: '2001-12-31',
          chargeStartDate: '2001-01-01',
          startDate: '2001-01-01',
          endDate: '2001-12-31'
        };
        const result = Joi.validate(data, schema());
        expect(result.error).not.to.exist();
      });
    });
  });
});
