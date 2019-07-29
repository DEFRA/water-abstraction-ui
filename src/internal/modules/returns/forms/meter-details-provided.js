const Joi = require('@hapi/joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');

const getRadioField = () => fields.radio('meterDetailsProvided', {
  mapper: 'booleanMapper',
  label: 'Have meter details been provided?',
  subHeading: true,
  errors: {
    'any.required': {
      message: 'Select if meter details have been provided'
    }
  },
  choices: [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ]
});

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getRadioField(),
    getCsrfTokenField(request),
    getContinueField()
  ]
}, { meterDetailsProvided: get(data, 'meters[0].meterDetailsProvided') });

exports.schema = () => ({
  meterDetailsProvided: Joi.boolean().required(),
  csrf_token: Joi.string().guid().required()
});
