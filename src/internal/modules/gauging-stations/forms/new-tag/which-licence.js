const Joi = require('joi')
const { get } = require('lodash')
const { formFactory, fields } = require('shared/lib/forms/')
const session = require('../../lib/session')

const licenceEntryForm = request => {
  const f = formFactory(request.path)

  const defaultLicence = get(session.get(request), 'licenceNumber.value')

  f.fields.push(fields.text('licenceNumber', {
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'any.required': {
        message: 'Enter a licence number'
      },
      'string.empty': {
        message: 'Enter a licence number'
      }
    },
    hint: 'You need to tag and add other licences with this threshold individually'
  }, defaultLicence))

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))
  return f
}

const licenceEntrySchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  licenceNumber: Joi.string().required()
})

exports.form = licenceEntryForm
exports.schema = licenceEntrySchema
