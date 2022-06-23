const { formFactory, fields } = require('shared/lib/forms')

const form = request => {
  const { csrfToken } = request.view

  const f = formFactory('/charge-information/upload', 'POST', 'joi', { encType: 'multipart/form-data' })

  f.fields.push(fields.file('file', {
    label: 'Use a .csv file under 20mb to upload.',
    attr: {
      accept: '.csv'
    }
  }))
  f.fields.push(fields.button(null, { label: 'Upload' }))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))

  return f
}

module.exports = form
