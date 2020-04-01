'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

const twoPartTariffQuantityConfirmForm = (request, quantity) => {
  const { csrfToken } = request.view;

  const { batchId, invoiceLicenceId, transactionId } = request.params;

  const action = `/billing/batch/${batchId}/two-part-tariff-licence-review/${invoiceLicenceId}/transaction/${transactionId}/confirm`;

  const f = formFactory(action, 'POST');

  f.fields.push(fields.hidden('value', quantity));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const twoPartTariffQuantityConfirmSchema = transaction => {
  const maxQuantity = parseFloat(transaction.chargeElement.authorisedAnnualQuantity);
  return {
    csrf_token: Joi.string().uuid().required(),
    quantity: Joi.number().required().min(0).max(maxQuantity)
  };
};

exports.form = twoPartTariffQuantityConfirmForm;
exports.schema = twoPartTariffQuantityConfirmSchema;
