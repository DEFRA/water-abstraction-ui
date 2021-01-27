'use strict';

const Joi = require('@hapi/joi');

const { fields } = require('shared/lib/forms/');
const confirmForm = require('shared/lib/forms/confirm-form');

const twoPartTariffQuantityConfirmForm = (request, quantity) => {
  const { batchId, licenceId, billingVolumeId } = request.params;
  const action = `/billing/batch/${batchId}/two-part-tariff/licence/${licenceId}/billing-volume/${billingVolumeId}/confirm`;
  const form = confirmForm.form(request, 'Continue', action);
  form.fields.push(fields.hidden('quantity', {}, quantity));
  return form;
};

const twoPartTariffQuantityConfirmSchema = transaction => {
  const maxQuantity = parseFloat(transaction.chargeElement.maxAnnualQuantity);
  return {
    csrf_token: Joi.string().uuid().required(),
    quantity: Joi.number().required().min(0).max(maxQuantity)
  };
};

exports.form = twoPartTariffQuantityConfirmForm;
exports.schema = twoPartTariffQuantityConfirmSchema;
