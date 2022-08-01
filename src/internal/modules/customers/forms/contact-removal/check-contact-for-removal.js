const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms/')
const session = require('../../session')

const confirmContactForRemovalForm = request => {
  const form = formFactory(request.path)

  const { isLastEmailContact } = session.get(request)

  if (isLastEmailContact) {
    form.fields.push(fields.warningText(null, {
      text: 'You\'re about to remove the only email contact for this customer. The licence holder will get future water abstraction alerts by post.'
    }))
  }

  form.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken))
  form.fields.push(fields.button(null, { label: 'Remove' }))

  return form
}

const confirmContactForRemovalSchema = () => {
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required()
  })
}

exports.form = confirmContactForRemovalForm
exports.schema = confirmContactForRemovalSchema
