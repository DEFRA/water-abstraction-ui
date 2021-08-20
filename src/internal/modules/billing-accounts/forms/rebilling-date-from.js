'use strict';

const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates;
const moment = require('moment');
const { sortBy, get } = require('lodash');
const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');

const getMostRecentBill = bills =>
  sortBy(bills, bill => moment(bill.dateCreated).unix()).pop();

const getMaxDate = bills => {
  if (bills.length === 0) {
    return null;
  }
  const mostRecentBill = getMostRecentBill(bills);
  return moment(mostRecentBill.batch.dateCreated);
};

/**
 * Gets form to select agreement signed date
 */
const form = request => {
  const fromDate = get(request.pre.rebillingState, 'fromDate', null);

  const { csrfToken } = request.view;

  const maxDate = isoToReadable(
    getMaxDate(request.pre.rebillableBills)
  );
  const maxDateError = maxDate
    ? `There are no bills available for reissue for this date.  Enter a date on or before ${maxDate}.`
    : 'There are no bills available for reissue for this billing account.';

  const f = formFactory(request.path);

  f.fields.push(fields.date('fromDate', {
    label: 'What date do you need to reissue a bill from?',
    caption: `Billing account ${request.pre.billingAccount.accountNumber}`,
    hint: `We'll show all the bills created in the service on or after this date. This will not include zero value and de minimus bills.`,
    heading: true,
    size: 'l',
    type: 'date',
    mapper: 'dateMapper',
    controlClass: 'form-control form-control--small',
    errors: {
      'any.required': {
        message: 'Enter the date you need to reissue a bill from'
      },
      'date.base': {
        message: 'Enter a real date'
      },
      'date.format': {
        message: 'Enter a real date'
      },
      'date.max': {
        message: maxDateError
      }
    }
  }, fromDate));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = request => {
  // if the max date is null default to a date in the past to display the message when no bills are available for re-issue
  const maxDate = isoToReadable(getMaxDate(request.pre.rebillableBills)) || '01 January 1999';
  return Joi.object().keys({
    fromDate: Joi.date().iso().max(maxDate).required(),
    csrf_token: Joi.string().guid().required()
  });
};

exports.form = form;
exports.schema = schema;
