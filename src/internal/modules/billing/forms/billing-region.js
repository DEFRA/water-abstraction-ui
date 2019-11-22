const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

const mapChoices = regionsData =>
  regionsData.map(region => ({
    label: region.name,
    value: region.regionId
  }));

/**
 * Creates an object to represent the form for capturing the
 * new user's email address.
 *
 * @param {Object} request The Hapi request object
 * @param  {Array} regions array of billing regions
  */
const selectBillingRegionForm = (request, regions) => {
  const { csrfToken } = request.view;
  const { billingType } = request.params;
  const action = '/billing/batch/region';
  const f = formFactory(action, 'POST');
  console.log(regions);

  f.fields.push(fields.radio('selectedBillingRegion', {
    errors: {
      'any.required': {
        message: 'Select the region'
      }
    },
    choices: mapChoices(regions)
  }));
  f.fields.push(fields.hidden('selectedBillingType', {}, billingType));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};
const billingRegionFormSchema = {
  csrf_token: Joi.string().uuid().required(),
  selectedBillingRegion: Joi.string().uuid().required(),
  selectedBillingType: Joi.string().required()
};

exports.selectBillingRegionForm = selectBillingRegionForm;
exports.billingRegionFormSchema = billingRegionFormSchema;
