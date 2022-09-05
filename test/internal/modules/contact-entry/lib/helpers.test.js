'use strict'

const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const sandbox = require('sinon').createSandbox()

const session = require('internal/modules/contact-entry/lib/session')

const helpers = require('internal/modules/contact-entry/lib/helpers')

const CONTACT_ID = 'test-contact-id'

experiment('src/internal/modules/contact-entry/lib/helpers', () => {
  let request, result
  beforeEach(async () => {
    sandbox.stub(session, 'get').returns({ data: { contactId: CONTACT_ID } })

    request = {
      params: {
        key: 'test-key'
      }
    }
  })

  afterEach(() => sandbox.restore())

  experiment('.getContactFromSession', () => {
    test('returns contact data from the session', () => {
      result = helpers.getContactFromSession(request)
      expect(result).to.equal({ contactId: CONTACT_ID })
    })

    test('returns an empty object if no data in the session', () => {
      session.get.returns()
      result = helpers.getContactFromSession(request)
      expect(result).to.equal({})
    })
  })
})
