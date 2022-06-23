
const noteForms = require('./forms')
const { handleFormRequest } = require('shared/lib/form-handler')
const session = require('./lib/session')

const getNote = async (request, h) => {
  const { noteId } = request.params
  const { caption, pageTitle = 'Add a note', back } = session.get(request, noteId) || {}
  const view = {
    ...request.view,
    pageTitle,
    caption,
    back,
    form: handleFormRequest(request, noteForms.note)
  }
  return h.view('nunjucks/form', view)
}

const postNote = async (request, h) => {
  const { noteId } = request.params
  const form = await handleFormRequest(request, noteForms.note)

  if (!form.isValid) {
    return h.postRedirectGet(form)
  }

  session.merge(request, noteId, {
    note: form.fields.find(field => field.name === 'note').value
  })

  const { redirectPath } = session.get(request, noteId) || {}

  return h.redirect(redirectPath)
}

module.exports.getNote = getNote
module.exports.postNote = postNote
