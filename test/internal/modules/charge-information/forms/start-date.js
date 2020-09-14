'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const Joi = require('joi');

const { form, schema } = require('internal/modules/charge-information/forms/start-date');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = isChargeable => ({
  view: {
    csrfToken: 'token'
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      startDate: '2020-02-02',
      endDate: '2020-12-02'
    },
    isChargeable,
    draftChargeInformation: {}
  }
});

experiment('internal/modules/charge-information/forms/start-date', () => {
  experiment('form', () => {
    experiment('when the licence is set to be chargeable', () => {
      let dateForm;

      beforeEach(async () => {
        dateForm = form(createRequest(true));
      });

      test('sets the form method to POST', async () => {
        expect(dateForm.method).to.equal('POST');
      });

      test('the action submits back to the expected url', async () => {
        expect(dateForm.action).to.equal('/licences/test-licence-id/charge-information/start-date');
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
          expect(radio.options.choices[1].hint).to.equal('2 February 2020');
        });

        test('has option for custom date', async () => {
          const radio = findField(dateForm, 'startDate');
          expect(radio.options.choices[3].label).to.equal('Another date');
        });

        test('has start date based errors for the custom date', async () => {
          const radio = findField(dateForm, 'startDate');
          const errors = radio.options.choices[3].fields[0].options.errors;

          expect(errors['any.required'].message).to.equal('Enter the charge information start date');
          expect(errors['date.base'].message).to.equal('Enter a real date for the charge information start date');
          expect(errors['date.min'].message).to.equal('You must enter a date after the licence start date');
          expect(errors['date.max'].message).to.equal('You must enter a date before the licence end date');
        });
      });
    });

    experiment('when the licence is set to be non-chargeable', () => {
      let dateForm;

      beforeEach(async () => {
        dateForm = form(createRequest(false));
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
          expect(radio.options.choices[1].hint).to.equal('2 February 2020');
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
  });

  experiment('schema', () => {
    let dateSchema;

    beforeEach(async () => {
      dateSchema = schema(createRequest(true));
    });

    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = dateSchema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = dateSchema.csrf_token.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('startDate', () => {
      test('can be an today', async () => {
        const result = dateSchema.startDate.validate('today');
        expect(result.error).to.not.exist();
      });

      test('can be an licenceStartDate', async () => {
        const result = dateSchema.startDate.validate('licenceStartDate');
        expect(result.error).to.not.exist();
      });

      test('can be an customDate', async () => {
        const result = dateSchema.startDate.validate('customDate');
        expect(result.error).to.not.exist();
      });

      test('cannot be an unexpected value', async () => {
        const result = dateSchema.startDate.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('customDate', () => {
      test('can be the start date', async () => {
        const data = {
          csrf_token: uuid(),
          startDate: 'customDate',
          customDate: '2020-02-02'
        };
        const result = Joi.validate(data, dateSchema);
        expect(result.error).to.not.exist();
      });

      test('can be the end date', async () => {
        const data = {
          csrf_token: uuid(),
          startDate: 'customDate',
          customDate: '2020-12-02'
        };
        const result = Joi.validate(data, dateSchema);
        expect(result.error).to.not.exist();
      });

      test('can be between the start and end date', async () => {
        const data = {
          csrf_token: uuid(),
          startDate: 'customDate',
          customDate: '2020-11-02'
        };
        const result = Joi.validate(data, dateSchema);
        expect(result.error).to.not.exist();
      });

      test('cannot be before the licence start date', async () => {
        const data = {
          csrf_token: uuid(),
          startDate: 'customDate',
          customDate: '2010-11-02'
        };
        const result = Joi.validate(data, dateSchema);
        expect(result.error).to.exist();
      });

      test('cannot be after the licence end date', async () => {
        const data = {
          csrf_token: uuid(),
          startDate: 'customDate',
          customDate: '2030-11-02'
        };
        const result = Joi.validate(data, dateSchema);
        expect(result.error).to.exist();
      });
    });
  });
});
