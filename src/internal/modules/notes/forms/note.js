const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms')
const session = require('../lib/session')

const MAX_NOTES_CHARACTERS = 500

/**
 * Creates a form object for internal users to create and update notes.
 * @return {Object}       form object
 */
const form = request => {
  const { csrfToken } = request.view
  const { noteId } = request.params
  const { note, hint } = session.get(request, noteId) || {}
  const f = formFactory(`/note/${noteId}`)

  f.fields.push(fields.text('note', {
    hint,
    multiline: true,
    maxlength: MAX_NOTES_CHARACTERS,
    errors: {
      'string.empty': {
        message: 'Enter details.'
      },
      'string.max': {
        message: `Enter no more than ${MAX_NOTES_CHARACTERS} characters.`
      }
    }
  }, note))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))

  return f
}

const schema = () => Joi.object().keys({
  csrf_token: Joi.string().guid().required(),
  note: Joi.string().max(MAX_NOTES_CHARACTERS)
})

exports.schema = schema
exports.form = form
