const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const routes = require('external/modules/core/routes')
const serverFactory = require('../../../lib/server-factory')

experiment('modules/core/routes', () => {
  let server

  experiment('/', () => {
    beforeEach(async () => {
      server = await serverFactory.createServer(
        serverFactory.createRouteWithNoOpHandler(routes.index)
      )
    })

    test('returns a 200 with no query params', async () => {
      const request = { method: 'get', url: '/' }
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('returns a 200 with a _ga query param', async () => {
      const request = { method: 'get', url: '/?_ga=track-me' }
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('extracts the _ga param into request.query', async () => {
      const request = { method: 'get', url: '/?_ga=track-me' }
      const response = await server.inject(request)
      expect(response.request.query).to.equal({
        _ga: 'track-me'
      })
    })

    test('returns a 200 with an unexpected query param', async () => {
      const request = { method: 'get', url: '/?_ga=track-me&cat=meow' }
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('only extracts expected params into request.query when passed unknown params', async () => {
      const request = { method: 'get', url: '/?_ga=track-me&cat=meow' }
      const response = await server.inject(request)
      expect(response.request.query).to.equal({
        _ga: 'track-me'
      })
    })
  })

  experiment('/status', () => {
    let response

    beforeEach(async () => {
      server = await serverFactory.createServer(routes.status)

      const request = { method: 'get', url: '/status' }
      response = await server.inject(request)
    })

    test('responds with a status code of 200', async () => {
      expect(response.statusCode).to.equal(200)
    })

    test('responds with an object containing the application status', async () => {
      expect(response.result.status).to.equal('alive')
    })
  })

  experiment('404 page', () => {
    let response

    beforeEach(async () => {
      server = await serverFactory.createServer(routes['404'])

      const request = { method: 'get', url: '/invalid-path' }
      response = await server.inject(request)
    })

    test('responds with a status code of 404', async () => {
      expect(response.statusCode).to.equal(404)
      expect(response.result).to.include('We cannot find that page')
    })
  })
})
