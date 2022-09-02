const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { find } = require('lodash')
const { form: amountsForm } = require('external/modules/returns/forms/amounts')

const createRequest = () => {
  return {
    view: {
      csrfToken: 'test-csrf-token'
    },
    query: {
      returnId: 'test-return-id'
    },
    auth: {
      credentials: {
        scope: 'external'
      }
    }
  }
}

experiment('amountsForm', () => {
  test('has a radio field for whether water has been abstracted field', async () => {
    const request = createRequest()
    const form = amountsForm(request, {})
    const isNil = find(form.fields, { name: 'isNil' })
    expect(isNil.options.widget).to.equal('radio')
  })

  test('external label is shown for external user', async () => {
    const request = createRequest()
    const form = amountsForm(request, {})
    const isNil = find(form.fields, { name: 'isNil' })
    expect(isNil.options.label).to.equal('Have you abstracted water in this return period?')
  })

  test('has a continue button', async () => {
    const request = createRequest()
    const form = amountsForm(request, {})
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue'
    })
    expect(button).to.exist()
  })

  test('has a hidden csrf field', async () => {
    const request = createRequest()
    const form = amountsForm(request, {})
    const csrf = form.fields.find(x => x.name === 'csrf_token')
    expect(csrf.value).to.equal('test-csrf-token')
  })
})
