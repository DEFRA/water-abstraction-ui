const { get } = require('lodash')
const { getContinueField, getCsrfTokenField, getHeadingField, getParagraphField } =
 require('shared/modules/returns/forms/common')
const { getLineFields, schema } = require('shared/modules/returns/forms/quantities')
const { formFactory, setValues, fields } = require('shared/lib/forms')
const { getLineValues } = require('shared/modules/returns/forms/quantities')

exports.form = (request, data) => {
  const isMeasured = get(data, 'reading.type') === 'measured'

  const f = {
    ...formFactory(),
    fields: [
      getCsrfTokenField(request),
      getHeadingField('Your abstraction volumes'),
      fields.insertText(null, {
        text: 'All submissions are converted to cubic metres and rounded to six decimal places.'
      }),
      ...getLineFields(data),
      getContinueField()
    ]
  }

  if (isMeasured) {
    f.fields.splice(3, 0, getParagraphField('Remember if you have a ×10 meter you need to multiply your volumes.'))
  }

  const values = getLineValues(data.lines)

  return setValues(f, values)
}

exports.schema = schema
