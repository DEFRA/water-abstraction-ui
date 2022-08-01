const { formFactory, setValues } = require('shared/lib/forms')
const { getMeter } = require('shared/modules/returns/forms/common')
const { get, set } = require('lodash')

const { getContinueField, getCsrfTokenField, getHeadingField } =
 require('shared/modules/returns/forms/common')
const { getStartReadingField, getLineFields, schema } =
  require('shared/modules/returns/forms/meter-readings')

const form = (request, data) => {
  const f = {
    ...formFactory(),
    fields: [
      getHeadingField('Meter readings'),
      getStartReadingField('Start reading'),
      ...getLineFields(data),
      getCsrfTokenField(request),
      getContinueField()
    ]
  }

  const readings = getMeter(data).readings || {}
  set(readings, 'startReading', get(data, 'meters[0].startReading'))
  return setValues(f, readings)
}

module.exports = { form, schema }
