const { expect } = require('@hapi/code')
const { find } = require('lodash')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { uploadForm } = require('external/modules/returns/forms/upload')
const { scope } = require('external/lib/constants')

experiment('uploadForm', () => {
  let form, request

  beforeEach(async () => {
    request = {
      view: {
        csrfToken: 'xyz'
      },
      query: {
        returnId: 'abc'
      },
      auth: {
        credentials: {
          scope: [scope.internal]
        }
      }
    }

    form = uploadForm(request)
  })

  test('should contain the correct fields', async () => {
    const names = form.fields.map(row => row.name).filter(x => x)
    expect(names).to.include(['csrf_token', 'file'])
  })

  test('upload field should only accept CSV files', async () => {
    const field = find(form.fields, { name: 'file' })
    expect(field.options.attr.accept).to.equal('.csv')
  })

  test('should include the CSRF token from the request', async () => {
    const csrf = find(form.fields, { name: 'csrf_token' })
    expect(csrf.value).to.equal(request.view.csrfToken)
  })
})
