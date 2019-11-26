const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');
const { ANNUAL,
  SUPPLEMENTARY,
  TWO_PART_TARIFF } = require('../lib/bill-run-types');

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
    label: 'Two-part tariff'
  }];

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
  const validBillRunTypes = [ ANNUAL, SUPPLEMENTARY, TWO_PART_TARIFF ];

  return {
    csrf_token: Joi.string().uuid().required(),
    selectedBillingType: Joi.string().required().valid(validBillRunTypes)
  };
};

exports.selectBillingTypeForm = selectBillingTypeForm;
exports.billingTypeFormSchema = billingTypeFormSchema;
