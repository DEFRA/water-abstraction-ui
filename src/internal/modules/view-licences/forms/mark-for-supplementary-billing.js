const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms/')

const markForSupplementaryBillingForm = request => {
  const f = formFactory(request.path)

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken))
  f.fields.push(fields.hidden('licenceId', {}, request.params.licenceId))

  f.fields.push(fields.button(null, { label: 'Confirm' }))
  return f
}

const markForSupplementaryBillingSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  licenceId: Joi.string().uuid().required()
})

exports.form = markForSupplementaryBillingForm
exports.schema = markForSupplementaryBillingSchema
