'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const Hapi = require('@hapi/hapi')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { http } = require('@envage/water-abstraction-helpers')
const plugin = require('../../../../src/internal/lib/hapi-plugins/internal-user-id')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

experiment('internal/lib/hapi-plugins/internal-user-id', () => {
  let onPreRequestHandler

  beforeEach(async () => {
    sandbox.stub(http, 'onPreRequest')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('when registered', () => {
    let server

    beforeEach(async () => {
      server = {
        ext: sandbox.spy(),
        listener: { prependListener: sandbox.spy() }
      }

      await plugin.register(server)
    })

    test('a store is created for each incoming request', async () => {
      expect(server.listener.prependListener.calledOnceWith('request')).to.be.true()
    })

    test('a single http.onPreRequest listener is set up', async () => {
      expect(http.onPreRequest.calledOnce).to.be.true()
    })

    test('an onPreHandler extension is added', async () => {
      expect(server.ext.calledOnce).to.be.true()
      expect(server.ext.firstCall.args[0].type).to.equal('onPreHandler')
    })
  })

  experiment('when there is no request being handled', () => {
    test('the outgoing request headers are not changed', async () => {
      const server = {
        ext: sandbox.spy(),
        listener: { prependListener: sandbox.spy() }
      }

      await plugin.register(server)

      const options = {}
      http.onPreRequest.firstCall.args[0](options)

      expect(options.headers).to.be.undefined()
    })
  })

  experiment('when requests from different users overlap', () => {
    let server

    beforeEach(async () => {
      server = Hapi.server({ port: 0 })

      // Stand in for the auth strategy, which puts the signed in user on the request
      server.ext('onPreAuth', (request, h) => {
        request.defra = { user: { user_id: request.headers['x-test-user-id'] } }

        return h.continue
      })

      // The real app has other onPreHandler extensions ahead of this plugin's, which wait on async work. This one
      // stands in for them
      server.ext('onPreHandler', async (request, h) => {
        await delay(1)

        return h.continue
      })

      await server.register(plugin)

      onPreRequestHandler = http.onPreRequest.firstCall.args[0]

      // Makes an 'outgoing request' after a delay, so requests with a longer delay are still in flight when later ones
      // start and finish
      server.route({
        method: 'GET',
        path: '/outgoing/{delay}',
        handler: async request => {
          await delay(Number(request.params.delay))

          const options = {}
          onPreRequestHandler(options)

          return { userId: options.headers?.['defra-internal-user-id'] ?? null }
        }
      })

      await server.start()
    })

    afterEach(async () => {
      await server.stop()
    })

    test('each outgoing request is sent with the user of the request that made it', async () => {
      const get = async (delayMs, userId) => {
        const response = await fetch(`${server.info.uri}/outgoing/${delayMs}`, { headers: { 'x-test-user-id': userId } })

        return (await response.json()).userId
      }

      const userIds = await Promise.all([get(50, 'user-a'), get(10, 'user-b'), get(30, 'user-c')])

      expect(userIds).to.equal(['user-a', 'user-b', 'user-c'])
    })
  })
})
