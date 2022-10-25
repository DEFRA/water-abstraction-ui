'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code
const sandbox = Sinon.createSandbox()

// Things we need to stub
const acceptanceTestsProxyService = require(
  '../../../../src/internal/lib/connectors/services/water/AcceptanceTestsProxyService'
)

// Thing under test
const controller = require('../../../../src/internal/modules/acceptance-tests-proxy/controller')

experiment('Acceptance tests proxy controller', () => {
  let request
  let h

  beforeEach(async () => {
    h = { response: sandbox.spy() }
  })

  afterEach(() => {
    sandbox.restore()
  })

  experiment('.postAcceptanceTestsProxy', () => {
    beforeEach(() => {
      request = {
        params: {
          tail: 'tear-down'
        },
        payload: null
      }
    })

    experiment('when the request is valid', () => {
      beforeEach(() => {
        sandbox.stub(acceptanceTestsProxyService.prototype, 'postToPath').resolves('Tear down complete')
      })

      test('returns whatever the water-api service returns', async () => {
        await controller.postAcceptanceTestsProxy(request, h)

        const response = h.response.lastCall.args[0]

        expect(response).to.equal('Tear down complete')
      })
    })

    experiment('when the request is invalid', () => {
      let errorResponse

      beforeEach(() => {
        errorResponse = {
          error: {
            statusCode: 404,
            message: 'Nah, lets rip it up!'
          }
        }
        sandbox.stub(acceptanceTestsProxyService.prototype, 'postToPath').rejects(errorResponse)
      })

      test('returns the water-api service error details', async () => {
        await controller.postAcceptanceTestsProxy(request, h)

        const response = h.response.lastCall.args[0]

        expect(response).to.equal(errorResponse.error)
      })
    })
  })
})
