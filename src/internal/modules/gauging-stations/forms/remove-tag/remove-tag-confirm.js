const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms/')
const { createSchema } = require('shared/lib/joi.helpers')

const removeTagConfirmForm = request => {
  const f = formFactory(request.path)

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken))
  f.fields.push(fields.button(null, { label: 'Confirm' }))
  return f
}

const removeTagConfirmSchema = createSchema({
  csrf_token: Joi.string().guid()
})

exports.form = removeTagConfirmForm
exports.schema = removeTagConfirmSchema
