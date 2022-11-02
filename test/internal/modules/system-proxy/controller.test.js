'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code
const sandbox = Sinon.createSandbox()

// Things we need to stub
const SystemProxyService = require(
  '../../../../src/internal/lib/connectors/services/water/SystemProxyService'
)

// Thing under test
const controller = require('../../../../src/internal/modules/system-proxy/controller')

experiment('System proxy controller', () => {
  let request
  let h

  let codeFake
  let typeFake
  let headerFake
  let responseFake

  beforeEach(async () => {
    codeFake = sandbox.fake()
    typeFake = sandbox.fake()
    headerFake = sandbox.fake.returns({ type: typeFake })
    responseFake = sandbox.fake.returns({ header: headerFake, code: codeFake })

    h = {
      response: responseFake
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  experiment('.getSystemProxy', () => {
    beforeEach(() => {
      request = {
        params: {
          tail: 'status'
        },
        payload: null
      }
    })

    experiment('when the request is valid', () => {
      beforeEach(() => {
        sandbox.stub(SystemProxyService.prototype, 'getToPath').resolves('OK')
      })

      test('returns whatever the system returns', async () => {
        await controller.getSystemProxy(request, h)

        const result = responseFake.lastCall.args[0]

        expect(result).to.equal('OK')
      })
    })

    experiment('when the request is invalid', () => {
      let errorResponse

      beforeEach(() => {
        errorResponse = {
          error: {
            statusCode: 404,
            message: 'OH NO'
          }
        }
        sandbox.stub(SystemProxyService.prototype, 'getToPath').rejects(errorResponse)
      })

      test('returns the system error details', async () => {
        await controller.getSystemProxy(request, h)

        const result = responseFake.lastCall.args[0]

        expect(result).to.equal(errorResponse.error)
      })
    })
  })

  experiment('.getSystemJsProxy', () => {
    beforeEach(() => {
      request = {
        payload: null
      }
    })

    experiment('when the request is valid', () => {
      beforeEach(() => {
        sandbox.stub(SystemProxyService.prototype, 'getToPath').resolves('OK')
      })

      test('returns whatever the system returns', async () => {
        await controller.getSystemJsProxy(request, h)

        const result = responseFake.lastCall.args[0]

        expect(result).to.equal('OK')
      })

      test('sets the expected header', async () => {
        await controller.getSystemJsProxy(request, h)

        const result = headerFake.lastCall.args

        expect(result).to.include(['cache-control', 'no-cache'])
      })

      test('sets the expected type', async () => {
        await controller.getSystemJsProxy(request, h)

        const result = typeFake.lastCall.args[0]

        expect(result).to.equal('application/javascript')
      })
    })

    experiment('when the request is invalid', () => {
      beforeEach(() => {
        const error = {
          statusCode: 404,
          message: 'OH NO'
        }
        sandbox.stub(SystemProxyService.prototype, 'getToPath').rejects(error)
      })

      test('returns the system error status code', async () => {
        await controller.getSystemJsProxy(request, h)

        const result = codeFake.lastCall.firstArg

        expect(result).to.equal(404)
      })
    })
  })

  experiment('.getSystemCssProxy', () => {
    beforeEach(() => {
      request = {
        payload: null
      }
    })

    experiment('when the request is valid', () => {
      beforeEach(() => {
        sandbox.stub(SystemProxyService.prototype, 'getToPath').resolves('OK')
      })

      test('returns whatever the system returns', async () => {
        await controller.getSystemCssProxy(request, h)

        const result = responseFake.lastCall.args[0]

        expect(result).to.equal('OK')
      })

      test('sets the expected header', async () => {
        await controller.getSystemCssProxy(request, h)

        const result = headerFake.lastCall.args

        expect(result).to.include(['cache-control', 'no-cache'])
      })

      test('sets the expected type', async () => {
        await controller.getSystemCssProxy(request, h)

        const result = typeFake.lastCall.args[0]

        expect(result).to.equal('text/css')
      })
    })

    experiment('when the request is invalid', () => {
      beforeEach(() => {
        const error = {
          statusCode: 404,
          message: 'OH NO'
        }
        sandbox.stub(SystemProxyService.prototype, 'getToPath').rejects(error)
      })

      test('returns the system error status code', async () => {
        await controller.getSystemCssProxy(request, h)

        const result = codeFake.lastCall.firstArg

        expect(result).to.equal(404)
      })
    })
  })
})
