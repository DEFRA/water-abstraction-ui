'use strict'

const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms')

const licenceNumbersForm = (request) => {
  const { csrfToken } = request.view

  const action = '/returns-notifications/forms'

  const f = formFactory(action)

  f.fields.push(fields.text('licenceNumbers', {
    errors: {
      'array.min': {
        message: 'Enter a licence number or licence numbers'
      }
    },
    mapper: 'licenceNumbersMapper',
    heading: true,
    multiline: true,
    rows: 5,
    controlClass: 'form-control form-control-3-4',
    label: 'Enter a licence number',
    hint: 'You can enter more than one licence. You can separate licence numbers using spaces, commas, or by entering them on different lines.'
  }))
  f.fields.push(fields.button(null, { label: 'Continue' }))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))

  return f
}

const schema = Joi.object().keys({
  licenceNumbers: Joi.array().min(1).items(Joi.string()),
  csrf_token: Joi.string().guid().required()
})

/**
 * Gets error message when licence number(s) are not found
 * @param {Array<String>} licenceNumbers
 * @return {Array<Object>}
 */
const createNotFoundError = licenceNumbers => {
  const isPlural = licenceNumbers.length > 1
  const summary = `The licence number${isPlural ? 's' : ''} ${licenceNumbers.join(', ')} could not be found`
  return [{
    summary,
    name: 'licenceNumbers',
    message: 'Enter a real licence number'
  }]
}

module.exports.form = licenceNumbersForm
module.exports.schema = schema
module.exports.createNotFoundError = createNotFoundError
