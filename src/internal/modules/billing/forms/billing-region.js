'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const { snakeCase } = require('lodash');
const Joi = require('joi');
const { TWO_PART_TARIFF } = require('../lib/bill-run-types');

const mapChoices = regionsData =>
  regionsData.map(region => ({
    label: region.displayName,
    value: region.regionId
  }));

/**
 * Creates an object to represent the form for selecting the region.
 *
 * @param {Object} request The Hapi request object
 * @param  {Array} regions array of billing regions
  */
const selectBillingRegionForm = (request, regions) => {
  const { csrfToken } = request.view;
  const billingType = snakeCase(request.params.billingType);
  const season = snakeCase(request.params.season);

  const action = '/billing/batch/region';
  const form = formFactory(action, 'POST');

  form.fields.push(fields.radio('selectedBillingRegion', {
    errors: {
      'any.required': {
        message: 'Select the region'
      }
    },
    choices: mapChoices(regions)
  }));

  form.fields.push(fields.hidden('selectedBillingType', {}, billingType));
  form.fields.push(fields.hidden('selectedTwoPartTariffSeason', {}, season));
  form.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  form.fields.push(fields.button(null, { label: 'Continue' }));
  return form;
};

const getRegionIds = regions => regions.map(region => region.regionId);

const billingRegionFormSchema = regions => (Joi.object({
  csrf_token: Joi.string().uuid().required(),
  selectedBillingRegion: Joi.string().uuid().required().valid(...getRegionIds(regions)),
  selectedBillingType: Joi.string().required(),
  selectedTwoPartTariffSeason: Joi.string().allow('').when('selectedBillingType', {
    is: TWO_PART_TARIFF,
    then: Joi.string().allow().required()
  })
}));

exports.selectBillingRegionForm = selectBillingRegionForm;
exports.billingRegionFormSchema = billingRegionFormSchema;
