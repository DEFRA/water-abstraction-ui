'use-strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const sessionHelpers = require('shared/lib/session-helpers')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

experiment('shared/lib/session-helpers', () => {
  let request

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.saveToSession', () => {
    beforeEach(async () => {
      request = {
        yar: {
          get: sandbox.stub().returns({ name: 'Jimmy Stage' }),
          set: sandbox.stub()
        }
      }
    })

    test('gets the session data using the session key', async () => {
      sessionHelpers.saveToSession(request, 'sessionKey')
      expect(request.yar.get.calledWith('sessionKey')).to.be.true()
    })

    test('sets the session data using the the session key', async () => {
      sessionHelpers.saveToSession(request, 'sessionKey')
      expect(request.yar.set.calledWith('sessionKey')).to.be.true()
    })

    test('saves the correct data to the session', async () => {
      const testSessionData = { name: 'Jimmy Page' }
      sessionHelpers.saveToSession(request, 'sessionKey', testSessionData)
      expect(request.yar.set.calledWith('sessionKey', testSessionData)).to.be.true()
    })

    test('merges the old and new data then saves the correct data to the session', async () => {
      request.yar.get.returns({ name: 'Jimmy Stage' })
      const dataToAdd = { band: 'Led Zeppelin', name: 'Jimmy Page' }
      sessionHelpers.saveToSession(request, 'sessionKey', dataToAdd)
      expect(request.yar.set.calledWith('sessionKey', dataToAdd)).to.be.true()
    })

    test('returns the correct data', async () => {
      const dataToAdd = { band: 'Led Zeppelin' }
      request.yar.set.returns({ name: 'Jimmy Stage', ...dataToAdd })
      const result = sessionHelpers.saveToSession(request, 'sessionKey', dataToAdd)
      expect(result).to.equal({ name: 'Jimmy Stage', ...dataToAdd })
    })

    test('returns the correct data when new data overwrites old data', async () => {
      const dataToAdd = { band: 'Led Zeppelin', name: 'Jimmy Page' }
      request.yar.set.returns({ name: 'Jimmy Stage', ...dataToAdd })
      const result = sessionHelpers.saveToSession(request, 'sessionKey', dataToAdd)
      expect(result).to.equal(dataToAdd)
    })
  })
})
