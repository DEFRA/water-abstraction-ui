const Joi = require('joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { get } = require('lodash');

const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');

const mapValue = data => {
  const value = get(data, 'reading.type');
  if (value === 'measured') {
    return true;
  }
  if (value === 'estimated') {
    return false;
  }
};

const getRadioField = () => fields.radio('meterUsed', {
  mapper: 'booleanMapper',
  label: 'Did they use a meter or meters?',
  subHeading: true,
  errors: {
    'any.required': {
      message: 'Select if a meter or meters were used'
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
}, { meterUsed: mapValue(data) });

exports.schema = () => ({
  meterUsed: Joi.boolean().required(),
  csrf_token: Joi.string().guid().required()
});
