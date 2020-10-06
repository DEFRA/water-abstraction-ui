'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('internal/modules/charge-information/forms/start-date');
const { findField, findButton } = require('../../../../lib/form-test');
const Joi = require('@hapi/joi');

const createRequest = (startDate, isChargeable = true) => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  pre: {
    licence: {
      id: 'test-licence-id',
      startDate: '2016-04-01',
      endDate: '2030-03-31'
    },
    draftChargeInformation: {
      dateRange: {
        startDate
      }
    },
    isChargeable
  }
});

experiment('internal/modules/charge-information/forms/start-date', () => {
  experiment('.form', () => {
    let startDateForm;
    beforeEach(() => {
      startDateForm = form(createRequest(), '2020-04-01');
    });

    test('sets the form method to POST', async () => {
      expect(startDateForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(startDateForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(startDateForm);
      expect(button.options.label).to.equal('Continue');
    });

    experiment('the start date radio options', () => {
      let startDateRadio;
      beforeEach(() => {
        startDateRadio = findField(startDateForm, 'startDate');
      });

      test('has a "today" option with expected hint text', async () => {
        const todayOption = startDateRadio.options.choices[0];
        expect(todayOption.label).to.equal('Today');
        expect(todayOption.value).to.equal('today');
        expect(todayOption.hint).to.equal('1 April 2020');
      });

      test('has a "licence start date" option with expected hint text', async () => {
        const licenceStartDateOption = startDateRadio.options.choices[1];
        expect(licenceStartDateOption.label).to.equal('Licence start date');
        expect(licenceStartDateOption.value).to.equal('licenceStartDate');
        expect(licenceStartDateOption.hint).to.equal('1 April 2016');
      });

      test('has an "or" divider', async () => {
        const { divider } = startDateRadio.options.choices[2];
        expect(divider).to.equal('or');
      });

      test('has custom date option', async () => {
        const customDateOption = startDateRadio.options.choices[3];
        expect(customDateOption.label).to.equal('Another date');
        expect(customDateOption.value).to.equal('customDate');
      });
    });

    experiment('when the licence is set to be non-chargeable', () => {
      let dateForm;

      beforeEach(async () => {
        dateForm = form(createRequest('2020-02-02', false));
      });

      test('sets the form method to POST', async () => {
        expect(dateForm.method).to.equal('POST');
      });

      test('the action submits back to the expected url', async () => {
        expect(dateForm.action).to.equal('/licences/test-licence-id/charge-information/effective-date');
      });

      test('has CSRF token field', async () => {
        const csrf = findField(dateForm, 'csrf_token');
        expect(csrf.value).to.equal('token');
      });

      test('has a submit button', async () => {
        const button = findButton(dateForm);
        expect(button.options.label).to.equal('Continue');
      });

      experiment('date choices', () => {
        test('has option for today', async () => {
          const radio = findField(dateForm, 'startDate');
          expect(radio.options.choices[0].label).to.equal('Today');
        });

        test('has option for licence start date', async () => {
          const radio = findField(dateForm, 'startDate');
          expect(radio.options.choices[1].label).to.equal('Licence start date');
          expect(radio.options.choices[1].hint).to.equal('1 April 2016');
        });

        test('has option for custom date', async () => {
          const radio = findField(dateForm, 'startDate');
          expect(radio.options.choices[3].label).to.equal('Another date');
        });

        test('has start date based errors for the custom date', async () => {
          const radio = findField(dateForm, 'startDate');
          const errors = radio.options.choices[3].fields[0].options.errors;

          expect(errors['any.required'].message).to.equal('Enter the effective date');
          expect(errors['date.base'].message).to.equal('Enter a real date for the effective date');
          expect(errors['date.min'].message).to.equal('You must enter a date after the licence start date');
          expect(errors['date.max'].message).to.equal('You must enter a date before the licence end date');
        });
      });
    });

    experiment('sets the value of the start date, when value is', () => {
      test('today', () => {
        startDateForm = form(createRequest('2020-04-01'), '2020-04-01');
        const startDateField = findField(startDateForm, 'startDate');
        expect(startDateField.value).to.equal('today');
      });

      test('licence start date', () => {
        startDateForm = form(createRequest('2016-04-01'), '2020-04-01');
        const startDateField = findField(startDateForm, 'startDate');
        expect(startDateField.value).to.equal('licenceStartDate');
      });

      test('custom date', () => {
        startDateForm = form(createRequest('2016-06-01'), '2020-04-01');
        const startDateField = findField(startDateForm, 'startDate');
        const customDateField = startDateField.options.choices.find(choice =>
          choice.value === 'customDate'
        );
        expect(startDateField.value).to.equal('customDate');
        expect(customDateField.fields[0].value).to.equal('2016-06-01');
      });
    });
  });

  experiment('.schema', () => {
    const csrfToken = 'c5afe238-fb77-4131-be80-384aaf245842';
    let startDateSchema;
    beforeEach(() => {
      startDateSchema = schema(createRequest());
    });
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = startDateSchema.csrf_token.validate(csrfToken);
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = startDateSchema.csrf_token.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('startDate', () => {
      const validStartDateValues = ['today', 'licenceStartDate', 'customDate'];
      validStartDateValues.forEach(value => {
        test(`can be ${value}`, async () => {
          const result = startDateSchema.startDate.validate(value);
          expect(result.error).to.not.exist();
        });
      });

      test('cannot be a unexpected string', async () => {
        const result = startDateSchema.startDate.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('customDate', () => {
      test('can be null when startDate is not "customDate"', async () => {
        const result = Joi.validate({
          csrf_token: csrfToken,
          startDate: 'today',
          customDate: null
        }, startDateSchema);
        expect(result.error).to.not.exist();
      });

      experiment('when startDate is "customDate"', () => {
        test('can be a date between the licence start and end dates', async () => {
          const result = Joi.validate({
            csrf_token: csrfToken,
            startDate: 'customDate',
            customDate: '2018-01-01'
          }, startDateSchema);
          expect(result.error).to.not.exist();
        });

        test('can be the same as licence start date', async () => {
          const result = Joi.validate({
            csrf_token: csrfToken,
            startDate: 'customDate',
            customDate: '2016-04-01'
          }, startDateSchema);
          expect(result.error).to.not.exist();
        });

        test('can be the same as licence end date', async () => {
          const result = Joi.validate({
            csrf_token: csrfToken,
            startDate: 'customDate',
            customDate: '2030-03-31'
          }, startDateSchema);
          expect(result.error).to.not.exist();
        });

        test('cannot be before the licence start date', async () => {
          const result = Joi.validate({
            csrf_token: csrfToken,
            startDate: 'customDate',
            customDate: '2014-04-01'
          }, startDateSchema);
          expect(result.error).to.exist();
        });

        test('cannot be after the licence start date', async () => {
          const result = Joi.validate({
            csrf_token: csrfToken,
            startDate: 'customDate',
            customDate: '2035-04-01'
          }, startDateSchema);
          expect(result.error).to.exist();
        });
      });
    });
  });
});
