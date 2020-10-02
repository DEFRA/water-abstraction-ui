'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const Joi = require('@hapi/joi');
const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/time-limit');
const { findField, findButton } = require('../../../../../lib/form-test');

const createRequest = draftChargeInformation => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  params: {
    licenceId: 'test-licence-id',
    elementId: 'test-element-id'
  },
  pre: {
    licence: { id: 'test-licence-id', expiredDate: '2020-12-31' },
    draftChargeInformation
  }
});

const testUuid = 'c5afe238-fb77-4131-be80-384aaf245842';

experiment('internal/modules/charge-information/forms/charge-element/time-limited', () => {
  let timeLimitForm;

  beforeEach(async () => {
    timeLimitForm = form(createRequest({
      chargeElements: []
    }));
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

    test('has a choice for setting a time limit', async () => {
      const radio = findField(timeLimitForm, 'timeLimitedPeriod');
      expect(radio.options.choices[0].label).to.equal('Yes');
      expect(radio.options.choices[0].value).to.equal('yes');
      expect(radio.options.choices[1].label).to.equal('No');
      expect(radio.options.choices[1].value).to.equal('no');
    });

    test('has start and end date fields under "yes" choice', async () => {
      const radio = findField(timeLimitForm, 'timeLimitedPeriod');
      const dateFields = radio.options.choices[0].fields;
      expect(dateFields.length).to.equal(2);
      expect(dateFields[0].name).to.equal('startDate');
      expect(dateFields[0].options.label).to.equal('Enter start date');
      expect(dateFields[0].options.widget).to.equal('date');
      expect(dateFields[1].name).to.equal('endDate');
      expect(dateFields[1].options.label).to.equal('Enter end date');
      expect(dateFields[1].options.widget).to.equal('date');
    });

    test('sets the value of the timeLimitedPeriod, if provided', async () => {
      timeLimitForm = form(createRequest({ chargeElements: [{
        id: 'test-element-id'
      }] }));
      const radio = findField(timeLimitForm, 'timeLimitedPeriod');
      expect(radio.value).to.equal('no');
    });

    test('sets the value of the timeLimitedPeriod dates, if provided', async () => {
      timeLimitForm = form(createRequest({
        chargeElements: [{
          id: 'test-element-id',
          timeLimitedPeriod: {
            startDate: '2020-04-01',
            endDate: '2021-03-31'
          }
        }]
      }));
      const radio = findField(timeLimitForm, 'timeLimitedPeriod');
      const startDateField = findField(radio.options.choices[0], 'startDate');
      const endDateField = findField(radio.options.choices[0], 'endDate');
      expect(radio.value).to.equal('yes');
      expect(startDateField.value).to.equal('2020-04-01');
      expect(endDateField.value).to.equal('2021-03-31');
    });
  });

  experiment('schema', () => {
    let timeLimitSchema;
    beforeEach(() => {
      timeLimitSchema = schema(createRequest({
        dateRange: {
          startDate: '2001-01-01'
        }
      }));
    });
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = timeLimitSchema.csrf_token.validate(testUuid);
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = timeLimitSchema.csrf_token.validate('sciccors');
        expect(result.error).to.exist();
      });
    });

    experiment('timeLimitedPeriod', () => {
      test('validates yes', async () => {
        const result = timeLimitSchema.timeLimitedPeriod.validate('yes');
        expect(result.error).to.not.exist();
      });
      test('validates no', async () => {
        const result = timeLimitSchema.timeLimitedPeriod.validate('no');
        expect(result.error).to.not.exist();
      });

      test('can not be a nomral string', async () => {
        const result = timeLimitSchema.timeLimitedPeriod.validate('something');
        expect(result.error).to.exist();
      });
    });
    experiment('startDate', () => {
      test('accepts a valid date', async () => {
        const result = timeLimitSchema.startDate.validate('2001-01-02');
        expect(result.error).to.not.exist();
      });
      test('accepts an empty string', async () => {
        const result = timeLimitSchema.startDate.validate('');
        expect(result.error).to.not.exist();
      });
      test('is not required if timeLimitedPeriod is no', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'no'
        };
        const result = Joi.validate(data, timeLimitSchema);
        expect(result.error).not.to.exist();
      });
    });
    experiment('endDate', () => {
      test('accepts a valid date', async () => {
        const result = timeLimitSchema.endDate.validate('2001-01-02');
        expect(result.error).to.not.exist();
      });
      test('accepts an empty string', async () => {
        const result = timeLimitSchema.endDate.validate('');
        expect(result.error).to.not.exist();
      });
      test('is not required if timeLimitedPeriod is no/false', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'no'
        };
        const result = Joi.validate(data, timeLimitSchema);
        expect(result.error).not.to.exist();
      });
    });
    experiment('when timeLimitedPeriod is yes', () => {
      test('accepts start and end dates', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          startDate: '2001-01-02',
          endDate: '2001-02-08'
        };
        const result = Joi.validate(data, timeLimitSchema);
        expect(result.error).not.to.exist();
      });
      test('fails when startDate is before chargeStartDate', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          startDate: '2000-01-02',
          endDate: '2001-02-08'
        };
        const result = Joi.validate(data, timeLimitSchema);
        expect(result.error).to.exist();
      });
      test('fails when endDate is after expiredDate', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          startDate: '2001-01-02',
          endDate: '2002-02-08',
          draftChargeInformation: { startDate: '2001-01-01' },
          licence: { expiredDate: '2001-12-31' }
        };
        const result = Joi.validate(data, timeLimitSchema);
        expect(result.error).to.exist();
      });
      test('is OK when start and end dates are on the boundaries', async () => {
        const data = {
          csrf_token: testUuid,
          timeLimitedPeriod: 'yes',
          startDate: '2001-01-01',
          endDate: '2001-12-31'
        };
        const result = Joi.validate(data, timeLimitSchema);
        expect(result.error).not.to.exist();
      });
    });
  });
});
