const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { getContinueField, getCsrfTokenField, getSuffix } =
 require('shared/modules/returns/forms/common');

const getRadioField = suffix => fields.radio('isSingleTotal', {
  label: 'Is it a single volume?',
  subHeading: true,
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
});

exports.form = (request, data) => {
  const suffix = getSuffix(data.reading.units);

  const form = {
    ...formFactory(),
    fields: [
      getRadioField(suffix),
      getCsrfTokenField(request),
      getContinueField()
    ]
  };

  const isSingleTotal = get(data, 'reading.totalFlag');
  const total = get(data, 'reading.total');

  return setValues(form, { isSingleTotal, total });
};

exports.schema = () => ({
  isSingleTotal: Joi.boolean().required(),
  total: Joi.when('isSingleTotal', { is: true, then: Joi.number().required().min(0) }),
  csrf_token: Joi.string().guid().required()
});
