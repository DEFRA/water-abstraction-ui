const { fields } = require('shared/lib/forms')

const getIsNilField = label => fields.radio('isNil', {
  label,
  subHeading: true,
  mapper: 'booleanMapper',
  errors: {
    'any.required': {
      message: 'Has any water been abstracted?'
    }
  },
  choices: [
    { value: false, label: 'Yes' },
    { value: true, label: 'No' }
  ]
})

exports.getIsNilField = getIsNilField
