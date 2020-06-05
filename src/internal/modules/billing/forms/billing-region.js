'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const { snakeCase } = require('lodash');
const Joi = require('@hapi/joi');
const { TWO_PART_TARIFF } = require('../lib/bill-run-types');

const mapChoices = regionsData =>
  regionsData.map(region => ({
    label: region.displayName,
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
  const billingType = snakeCase(request.params.billingType);
  const season = snakeCase(request.params.season);

  const action = '/billing/batch/region';
  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('selectedBillingRegion', {
    errors: {
      'any.required': {
        message: 'Select the region'
      }
    },
    choices: mapChoices(regions)
  }));

  f.fields.push(fields.hidden('selectedBillingType', {}, billingType));
  f.fields.push(fields.hidden('selectedTwoPartTariffSeason', {}, season));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const getRegionIds = regions => regions.map(region => region.regionId);

const billingRegionFormSchema = regions => ({
  csrf_token: Joi.string().uuid().required(),
  selectedBillingRegion: Joi.string().uuid().required().valid(getRegionIds(regions)),
  selectedBillingType: Joi.string().required(),
  selectedTwoPartTariffSeason: Joi.string().allow('').when('selectedBillingType', {
    is: TWO_PART_TARIFF,
    then: Joi.string().required()
  })
});

exports.selectBillingRegionForm = selectBillingRegionForm;
exports.billingRegionFormSchema = billingRegionFormSchema;
