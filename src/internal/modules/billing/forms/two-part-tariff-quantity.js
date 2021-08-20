'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');

/**
 * Gets an array of form choices for the billable quantity
 * @param {Number} authorisedAnnualQuantity
 * @return {Array}
 */
const getRadioChoices = authorisedAnnualQuantity => [{
  label: `Authorised (${authorisedAnnualQuantity}Ml)`,
  value: 'authorised'
}, {
  label: 'Custom (Ml)',
  value: 'custom',
  fields: [
    fields.text('customQuantity', {
      label: 'Billable quantity',
      hint: 'Enter a number with no more than 6 decimal places. For example, 20.123456',
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
}];

/**
 * Gets a form field object for the billable quantity radio button
 * @param {Number} authorisedAnnualQuantity
 * @return {Object} form radio object
 */
const getQuantityRadio = authorisedAnnualQuantity => fields.radio('quantity', {
  errors: {
    'any.required': {
      message: 'Select the billable quantity'
    }
  },
  choices: getRadioChoices(authorisedAnnualQuantity)
});

const twoPartTariffQuantityForm = (request, billingVolume) => {
  const { csrfToken } = request.view;

  const { batchId, licenceId, billingVolumeId } = request.params;
  const { authorisedAnnualQuantity } = billingVolume.chargeElement;

  const action = `/billing/batch/${batchId}/two-part-tariff/licence/${licenceId}/billing-volume/${billingVolumeId}`;

  const f = formFactory(action, 'POST');

  f.fields.push(getQuantityRadio(authorisedAnnualQuantity));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const twoPartTariffQuantitySchema = billingVolume => {
  const maxQuantity = parseFloat(billingVolume.chargeElement.maxAnnualQuantity);
  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    quantity: Joi.string().valid('authorised', 'custom').required(),
    customQuantity: Joi.when('quantity', {
      is: 'custom',
      then: Joi.number().required().min(0).max(maxQuantity).precision(6)
    })
  });
};

exports.form = twoPartTariffQuantityForm;
exports.schema = twoPartTariffQuantitySchema;
