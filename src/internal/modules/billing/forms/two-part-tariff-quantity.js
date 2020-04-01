'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

const twoPartTariffQuantityForm = (request, transaction) => {
  const { csrfToken } = request.view;

  const { batchId, invoiceLicenceId, transactionId } = request.params;
  const { authorisedAnnualQuantity } = transaction.chargeElement;

  const action = `/billing/batch/${batchId}/two-part-tariff-licence-review/${invoiceLicenceId}/transaction/${transactionId}`;

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('quantity', {
    label: 'Set the billable quantity for this bill run',
    subHeading: true,
    errors: {
      'any.required': {
        message: 'Select the billable quantity'
      }
    },
    choices: [{
      label: `Authorised (${authorisedAnnualQuantity}ML)`,
      value: 'authorised'
    }, {
      label: 'Custom (ML)',
      value: 'custom',
      fields: [
        fields.text('customQuantity', {
          label: 'Billable quantity',
          type: 'number',
          controlClass: 'govuk-!-width-one-third',
          errors: {
            'number.base': {
              message: 'Enter the billable quantity'
            },
            'number.min': {
              message: 'The quantity must be zero or higher'
            },
            'number.max': {
              message: 'The quantity must be the same as or less than the authorised amount'
            }
          }
        })
      ]
    }]
  }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const twoPartTariffQuantitySchema = transaction => {
  const maxQuantity = parseFloat(transaction.chargeElement.authorisedAnnualQuantity);
  return {
    csrf_token: Joi.string().uuid().required(),
    quantity: Joi.string().valid(['authorised', 'custom']).required(),
    customQuantity: Joi.when('quantity', { is: 'custom', then: Joi.number().required().min(0).max(maxQuantity) })
  };
};

exports.form = twoPartTariffQuantityForm;
exports.schema = twoPartTariffQuantitySchema;
