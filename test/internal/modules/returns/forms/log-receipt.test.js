const { expect } = require('@hapi/code')
const moment = require('moment')
const { find } = require('lodash')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { logReceiptForm, logReceiptSchema } = require('internal/modules/returns/forms/log-receipt')
const { scope } = require('internal/lib/constants')

experiment('logReceiptForm', () => {
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

    form = logReceiptForm(request, {})
  })

  test('should contain the correct fields', async () => {
    const names = form.fields.map(row => row.name).filter(x => x)
    expect(names).to.include(['csrf_token', 'dateReceived', 'isUnderQuery'])
  })

  test('should include the CSRF token from the request', async () => {
    const csrf = find(form.fields, { name: 'csrf_token' })
    expect(csrf.value).to.equal(request.view.csrfToken)
  })

  test('the received date field should default to today', async () => {
    const today = moment().format('YYYY-MM-DD')
    const date = find(form.fields, { name: 'dateReceived' })
    expect(date.value).to.equal(today)
  })
})

experiment('logReceiptSchema', () => {
  test('should contain the correct fields', async () => {
    const schema = logReceiptSchema()
    const keys = Array.from(schema._ids._byKey.keys())
    expect(keys).to.only.include(['csrf_token', 'dateReceived', 'isUnderQuery'])
  })
})
