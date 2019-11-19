const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('@hapi/joi');

const choices = [
  {
    value: 'annual',
    label: 'Annual'
  },
  {
    value: 'supplementary',
    label: 'Supplementary'
  },
  {
    value: 'two_part_tarriff',
    label: 'Two-part tarriff'
  }];

/**
 * Creates an object to represent the form for capturing the
 * new user's email address.
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
      }
    },
    choices
  }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const billingTypeFormSchema = {
  csrf_token: Joi.string().uuid().required(),
  selectedBillingType: Joi.string().required()
};

exports.selectBillingTypeForm = selectBillingTypeForm;
exports.billingTypeFormSchema = billingTypeFormSchema;
