const { get } = require('lodash');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');

const getRadioField = () => fields.radio('method', {
  label: 'How was this return reported?',
  subHeading: true,
  errors: {
    'any.required': {
      message: 'Select meter readings, or abstraction volumes'
    }
  },
  choices: [
    { value: 'oneMeter', label: 'Meter readings' },
    { value: 'abstractionVolumes', label: 'Abstraction volumes' }
  ]
});

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getRadioField(),
    getCsrfTokenField(request),
    getContinueField()
  ]
}, { method: get(data, 'reading.method') });
