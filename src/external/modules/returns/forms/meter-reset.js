const { formFactory, fields } = require('shared/lib/forms');
const { getContinueField, getCsrfTokenField, getHeadingField } =
 require('shared/modules/returns/forms/common');

exports.form = (request, data) => ({
  ...formFactory(),
  fields: [
    getHeadingField('Did your meter reset in this abstraction period?'),
    fields.radio('meterReset', {
      mapper: 'booleanMapper',
      errors: {
        'any.required': {
          message: 'Has your meter reset or rolled over?'
        }
      },
      choices: [
        { value: true, label: 'Yes', hint: 'You will need to provide abstraction volumes instead of meter readings' },
        { value: false, label: 'No' }
      ] }),
    getCsrfTokenField(request),
    getContinueField()
  ]
});
