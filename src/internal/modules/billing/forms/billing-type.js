'use strict';

const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms/');
const {
  ANNUAL,
  SUPPLEMENTARY,
  TWO_PART_TARIFF
} = require('../lib/bill-run-types');

const seasons = require('../lib/seasons');

const seasonChoices = [
  { value: seasons.SUMMER, label: 'Summer' },
  { value: seasons.WINTER_AND_ALL_YEAR, label: 'Winter and All year' }
];

const choices = [
  {
    value: ANNUAL,
    label: 'Annual'
  },
  {
    value: SUPPLEMENTARY,
    label: 'Supplementary'
  },
  {
    value: TWO_PART_TARIFF,
    label: 'Two-part tariff',
    fields: [
      fields.radio('twoPartTariffSeason', {
        errors: {
          'any.required': { message: 'Select a season' }
        },
        choices: seasonChoices
      })
    ]
  }
];

/**
 * Creates an object to represent the form for capturing the
 * bill run type i.e. annual...
 *
 * @param {Object} request The Hapi request object
 * @param {string} billRunType The type of bill run selected
  */
const selectBillingTypeForm = (request) => {
  const { csrfToken } = request.view;
  const action = '/billing/batch/type';

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('selectedBillingType', {
    errors: {
      'any.required': {
        message: 'Which kind of bill run do you want to create?'
      },
      'any.allowOnly': {
        message: 'You must select supplementary to continue'
      }
    },
    choices
  }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const billingTypeFormSchema = (request) => {
  const validBillRunTypes = [ANNUAL, SUPPLEMENTARY, TWO_PART_TARIFF];

  return {
    csrf_token: Joi.string().uuid().required(),
    selectedBillingType: Joi.string().required().valid(validBillRunTypes),
    twoPartTariffSeason: Joi.string().when(
      'selectedBillingType',
      {
        is: TWO_PART_TARIFF,
        then: Joi.string().required().valid(Object.values(seasons))
      }
    )
  };
};

exports.selectBillingTypeForm = selectBillingTypeForm;
exports.billingTypeFormSchema = billingTypeFormSchema;
