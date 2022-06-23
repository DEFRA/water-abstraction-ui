'use strict'

const { experiment, test, beforeEach, before } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const serverFactory = require('../../../lib/server-factory')
const routes = require('internal/modules/core/routes')

experiment('/status', () => {
  let server, response

  before(async () => {
    server = await serverFactory.createServer()
    server.route(Object.values(routes))
  })

  experiment('status page', () => {
    beforeEach(async () => {
      const request = { method: 'get', url: '/status' }
      response = await server.inject(request)
    })

    test('responds with a status code of 200', async () => {
      expect(response.statusCode).to.equal(200)
    })

    test('responds with an object containing the application version', async () => {
      expect(response.result.version).to.match(/\d*\.\d*\.\d*/g)
    })
  })

  experiment('404 page', () => {
    beforeEach(async () => {
      const request = { method: 'get', url: '/invalid-path' }
      response = await server.inject(request)
    })

    test('responds with a status code of 404', async () => {
      expect(response.statusCode).to.equal(404)
      expect(response.result).to.include('We cannot find that page')
    })
  })
})
