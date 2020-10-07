'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const datePicker = require('internal/modules/agreements/forms/lib/date-picker');
const Joi = require('@hapi/joi');

experiment('internal/modules/agreements/forms/lib/date-picker', () => {
  experiment('.getMaxDate', () => {
    test('returns the earliest of licence end date and current date when the licence end date is earlier', async () => {
      const { maxDate, isLicenceEndDate } = datePicker.getMaxDate('2020-09-01', '2020-09-29');
      expect(maxDate).to.equal('2020-09-01');
      expect(isLicenceEndDate).to.be.true();
    });

    test('returns the earliest of licence end date and current date when today is earlier', async () => {
      const { maxDate, isLicenceEndDate } = datePicker.getMaxDate('2020-09-29', '2020-09-01');
      expect(maxDate).to.equal('2020-09-01');
      expect(isLicenceEndDate).to.be.false();
    });
  });

  experiment('.getCommonErrors', () => {
    test('returns the correct common date field errors when the licence end date is earlier', async () => {
      const errors = datePicker.getCommonErrors('2020-09-01', '2020-09-29');
      expect(errors).to.equal({
        'date.max': { message: 'Enter a date no later than the licence end date' },
        'date.min': {
          message: 'Enter a date that is no earlier than the licence start date'
        }
      });
    });

    test('returns the correct common date field errors when today is earlier', async () => {
      const errors = datePicker.getCommonErrors('2020-09-29', '2020-09-01');
      expect(errors).to.equal({
        'date.max': { message: 'The date you enter must be today’s date or earlier. It cannot be in the future' },
        'date.min': {
          message: 'Enter a date that is no earlier than the licence start date'
        }
      });
    });
  });

  experiment('.getDateValidator', () => {
    const validator = datePicker.getDateValidator({
      startDate: '2019-01-01',
      endDate: '2019-12-31'
    });

    test('a date before the licence start date gives an error', async () => {
      const { error } = Joi.validate('2018-12-31', validator);
      expect(error).to.not.be.null();
    });

    test('the licence start date gives no error', async () => {
      const { error } = Joi.validate('2019-01-01', validator);
      expect(error).to.be.null();
    });

    test('the licence end date gives no error', async () => {
      const { error } = Joi.validate('2019-12-31', validator);
      expect(error).to.be.null();
    });

    test('a date after the licence end date gives an error', async () => {
      const { error } = Joi.validate('2020-01-01', validator);
      expect(error).to.not.be.null();
    });
  });
});
