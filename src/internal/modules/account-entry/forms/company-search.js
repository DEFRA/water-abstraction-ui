'use strict'

const { formFactory, fields } = require('shared/lib/forms')
const Joi = require('joi')

const form = (request, defaultValue) => {
  const f = formFactory(request.path, 'get')

  f.fields.push(fields.text('q', {
    label: 'Enter the Companies House number or company name',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'string.empty': {
        message: 'Enter the Companies House number or company name'
      }
    }
  }, defaultValue))

  f.fields.push(fields.paragraph(null, {
    text: 'We’ll use this information to search the Companies House register.'
  }))

  f.fields.push(fields.button(null, { label: 'Find company' }))

  return f
}

const schema = () => Joi.object().keys({
  q: Joi.string().required()
})

exports.form = form
exports.schema = schema
