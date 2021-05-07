'use strict';

const moment = require('moment');
const { get } = require('lodash');
const Joi = require('@hapi/joi');
const sentenceCase = require('sentence-case');

const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates;

const { formFactory, fields } = require('shared/lib/forms/');

const mapBillToChoice = bill => ({
  value: bill.id,
  label: bill.invoiceNumber,
  hint: `${sentenceCase(bill.batch.type)} bill created on ${isoToReadable(bill.dateCreated)}`
});

const getSelectableBills = request => {
  const fromDate = get(request, 'pre.rebillingState.fromDate');
  return request.pre.rebillableBills.filter(
    bill => moment(bill.batch.dateCreated).isSameOrAfter(fromDate)
  );
};

/**
 * Gets form to select agreement signed date
 */
const form = request => {
  const { csrfToken } = request.view;

  const fromDate = get(request, 'pre.rebillingState.fromDate');
  const selectedBillIds = get(request, 'pre.rebillingState.selectedBillIds');

  const selectableBills = getSelectableBills(request);

  const f = formFactory(request.path);

  f.fields.push(fields.checkbox('selectedBillIds', {
    label: 'Select the bills you need to reissue',
    caption: `Billing account ${request.pre.billingAccount.accountNumber}`,
    hint: `Bills created on or after ${isoToReadable(fromDate)}`,
    heading: true,
    size: 'l',
    mapper: 'arrayMapper',
    controlClass: 'form-control form-control--small',
    choices: selectableBills.map(mapBillToChoice),
    errors: {
      'array.min': {
        message: 'You need to select at least one bill to reissue'
      }
    }
  }, selectedBillIds));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = request => {
  const selectableBills = getSelectableBills(request);
  const selectableBillIds = selectableBills.map(bill => bill.id);
  return Joi.object({
    selectedBillIds: Joi.array().min(1).items(
      Joi.string().guid().valid(selectableBillIds)
    ),
    csrf_token: Joi.string().guid().required()
  });
};

exports.form = form;
exports.schema = schema;
