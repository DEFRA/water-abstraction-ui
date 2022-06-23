const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms')
const session = require('../lib/session')

const form = request => {
  const f = formFactory(request.path)
  const { notificationCategories } = request.pre

  const { categories, senderInputValue } = session.get(request)

  f.fields.push(fields.checkbox('categories', {
    label: 'Notification type',
    controlClass: 'govuk-input govuk-input--width-10',
    choices: notificationCategories.map(category => ({
      value: category.categoryValue,
      label: category.categoryLabel
    }))
  }, categories))

  f.fields.push(fields.text('sender', {
    label: 'Sent by',
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'string.email': {
        message: 'Enter a valid email'
      }
    }
  }, senderInputValue))

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken))

  f.fields.push(fields.button(null, { label: 'Apply filters' }))

  return f
}

const schema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  categories: Joi.array().optional(),
  sender: Joi.string().allow('').email()
})

exports.form = form
exports.schema = schema
