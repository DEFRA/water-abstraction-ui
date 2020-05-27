'use strict';
const confirmForm = require('./confirm-form');

const { fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

const twoPartTariffQuantityConfirmForm = (request, quantity) => {
  const { batchId, invoiceLicenceId, transactionId } = request.params;
  const action = `/billing/batch/${batchId}/two-part-tariff/licence/${invoiceLicenceId}/transaction/${transactionId}/confirm`;
  const form = confirmForm(request, action, 'Continue');
  form.fields.push(fields.hidden('quantity', {}, quantity));
  return form;
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
