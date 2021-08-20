'use strict';

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const rebillingDateForm = require('internal/modules/billing-accounts/forms/rebilling-date-from');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  },
  params: {
    regionId: uuid(),
    companyId: uuid()
  },
  pre: {
    rebillableBills: [
      {
        dateCreated: '2020-05-01',
        batch: { dateCreated: '2020-05-01' }
      },
      {
        dateCreated: '2020-05-19',
        batch: { dateCreated: '2020-05-19' }
      }
    ],
    billingAccount: {
      accountNumber: 'AB123445567'
    }
  }
});

experiment('internal/billing-accounts/forms/rebilling-date-form', () => {
  let request;

  beforeEach(async => {
    request = createRequest();
  });
  test('sets the form method to POST', async () => {
    const form = rebillingDateForm.form(request);
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = rebillingDateForm.form(request);
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('has an "date from" field', async () => {
    const form = rebillingDateForm.form(request);
    const fromDate = findField(form, 'fromDate');
    expect(fromDate).to.exist();
  });

  test('the "date from" field has an error for date.max', async () => {
    const errorMessage = 'There are no bills available for reissue for this date.  Enter a date on or before 19 May 2020.';
    const form = rebillingDateForm.form(request);
    const fromDate = findField(form, 'fromDate');
    expect(fromDate.options.errors['date.max'].message).to.equal(errorMessage);
  });

  test('the "date from" field has the correct error for date.max when there are no rebillable bills', async () => {
    const errorMessage = 'There are no bills available for reissue for this billing account.';
    request.pre.rebillableBills = [];
    const form = rebillingDateForm.form(request);
    const fromDate = findField(form, 'fromDate');
    expect(fromDate.options.errors['date.max'].message).to.equal(errorMessage);
  });

  test('has a submit button', async () => {
    const form = rebillingDateForm.form(request);
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('invoice-accounts/forms/select-company schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = rebillingDateForm.schema(createRequest()).validate({
        csrf_token: uuid(),
        fromDate: '2020-01-01'
      });
      expect(result.error).to.be.undefined();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = rebillingDateForm.schema(createRequest()).validate({
        csrf_token: 'potato',
        fromDate: '2020-05-01'
      });
      expect(result.error).to.exist();
    });

    experiment('date from', () => {
      test('It allows a date before the max date', async () => {
        const result = rebillingDateForm.schema(createRequest()).validate({
          csrf_token: uuid(),
          fromDate: '1999-01-01'
        });
        expect(result.error).to.be.undefined();
      });

      test('It fails when the date is after the max date', async () => {
        const result = rebillingDateForm.schema(createRequest()).validate({
          csrf_token: uuid(),
          fromDate: '2020-06-01'
        });
        expect(result.error).to.exist();
      });

      test('It fails when the date is not a date', async () => {
        const result = rebillingDateForm.schema(createRequest()).validate({
          csrf_token: uuid(),
          fromDate: '2020-06-fas'
        });
        expect(result.error).to.exist();
      });
    });
  });
});
