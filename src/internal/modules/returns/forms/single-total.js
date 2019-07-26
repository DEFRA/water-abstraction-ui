const Joi = require('@hapi/joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { STEP_SINGLE_TOTAL, getPath } = require('../lib/flow-helpers');
const { getSuffix } = require('../lib/helpers');

const form = (request, data) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_SINGLE_TOTAL, request);

  const suffix = getSuffix(data.reading.units);

  const f = formFactory(action);

  f.fields.push(fields.radio('isSingleTotal', {
    label: 'Is it a single volume?',
    mapper: 'booleanMapper',
    errors: {
      'any.required': {
        summary: 'Select if you are reporting a single amount or not',
        message: 'Select if you are reporting a single amount'
      }
    },
    choices: [
      {
        value: true,
        label: 'Yes',
        fields: [
          fields.text('total', {
            label: 'Enter the total amount',
            type: 'number',
            controlClass: 'govuk-input--width-10',
            suffix,
            errors: {
              'number.base': {
                message: 'Enter a total figure'
              },
              'number.min': {
                message: 'Total figure must be greater than 0'
              }
            }
          })
        ]
      },
      { value: false, label: 'No' }
    ]
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  const isSingleTotal = get(data, 'reading.totalFlag');
  const total = get(data, 'reading.total');

  return setValues(f, { isSingleTotal, total });
};

const schema = {
  isSingleTotal: Joi.boolean().required(),
  total: Joi.when('isSingleTotal', { is: true, then: Joi.number().required().min(0) }),
  csrf_token: Joi.string().guid().required()
};

module.exports = {
  singleTotalForm: form,
  singleTotalSchema: schema
};
