'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { ROUTING_CONFIG } = require('../../lib/charge-categories/constants');
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');
const { createSchema } = require('shared/lib/joi.helpers');

/**
 * Form to request the charge adjustments
 *
 * @param {Object} request The Hapi request object
 */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeCategoryData(request);
  if (!data.adjustments) {
    data.adjustments = {};
  }
  const sessionValues = data.adjustments ? Object.keys(data.adjustments).filter(key => !!data.adjustments[key]) : [];
  const action = getChargeCategoryActionUrl(request, ROUTING_CONFIG.adjustments.step);

  const f = formFactory(action, 'POST');
  const requiredMessage = 'Select the adjustments that apply.';
  f.fields.push(fields.checkbox('adjustments', {
    errors: {
      'array.min': {
        message: 'At least one condition must be selected'
      },
      'array.required': {
        message: requiredMessage
      },
      'array.empty': {
        message: requiredMessage
      },
      'any.required': {
        message: requiredMessage
      },
      'any.empty': {
        message: requiredMessage
      }
    },
    hint: 'Select all that apply',
    choices: ROUTING_CONFIG.adjustments.options.map(item => {
      return {
        label: item.title,
        value: item.value,
        fields: item.hasFactor
          ? [
            fields.text(`${item.value}Factor`,
              {
                errors: {
                  'number.base': { message: `The '${item.title}' factor must not have more than 15 decimal places.` },
                  'number.greater': { message: `The '${item.title}' factor must be greater than 0` },
                  'number.less': { message: `The '${item.title}' factor must be less than 1` },
                  'number.precision': { message: `The '${item.title}' factor must not have more than 15 decimal places.` },
                  'number.unsafe': { message: `The '${item.title}' factor must not have more than 15 decimal places.` }
                },
                hint: item.hint || '',
                mapper: 'numberMapper',
                label: 'Factor',
                controlClass: 'govuk-input--width-20'
              }, data.adjustments[item.value])
          ]
          : []
      };
    })
  }, sessionValues));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => {
  const factorSchema =
  Joi.number().precision(15).greater(0).required().options({ convert: false });

  return createSchema({
    adjustments: Joi.array().min(1).required(),
    aggregateFactor: Joi.when('adjustments',
      {
        is: Joi.array().items(Joi.string().valid('aggregate').required(), Joi.string()),
        then: factorSchema
      }),
    chargeFactor: Joi.when('adjustments',
      {
        is: Joi.array().items(Joi.string().valid('charge').required(), Joi.string()),
        then: factorSchema
      }),
    s126Factor: Joi.when('adjustments',
      {
        is: Joi.array().items(Joi.string().valid('s126').required(), Joi.string()),
        then: Joi.number().precision(15).greater(0).less(1).required().options({ convert: false })
      }),
    csrf_token: Joi.string().uuid().required()
  });
};
exports.schema = schema;
exports.form = form;
