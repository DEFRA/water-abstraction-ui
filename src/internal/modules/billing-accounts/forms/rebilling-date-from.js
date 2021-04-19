'use strict';

const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates;
const moment = require('moment');
const { sortBy, get } = require('lodash');
const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms/');

const getMostRecentBill = bills =>
  sortBy(bills, bill => moment(bill.dateCreated).unix()).pop();

const getMaxDate = bills => {
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
      'date.isoDate': {
        message: 'Enter a real date'
      },
      'date.max': {
        message: `There are no bills available for reissue for this date.  Enter a date on or before ${maxDate}.`
      }
    }
  }, fromDate));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = request => {
  const maxDate = getMaxDate(request.pre.rebillableBills).format('YYYY-MM-DD');
  return Joi.object({
    fromDate: Joi.date().iso().max(maxDate).required(),
    csrf_token: Joi.string().guid().required()
  });
};

exports.form = form;
exports.schema = schema;
