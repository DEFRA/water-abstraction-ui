const { formFactory, fields } = require('shared/lib/forms')

const form = (request) => {
  const { csrfToken } = request.view

  const f = formFactory('/returns/upload', 'POST', 'joi', { encType: 'multipart/form-data' })

  f.fields.push(fields.file('file', {
    label: 'Upload a file',
    attr: {
      accept: '.csv'
    }
  }))
  f.fields.push(fields.paragraph('', { text: 'The licence holder is responsible for the data you\'re sending.' }))
  f.fields.push(fields.button(null, { label: 'Upload' }))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))

  return f
}

module.exports = {
  uploadForm: form
}
