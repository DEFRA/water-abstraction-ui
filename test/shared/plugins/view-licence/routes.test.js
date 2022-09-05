'use strict'

const Lab = require('@hapi/lab')
const { experiment, test, before } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')

const serverFactory = require('../../../lib/server-factory')
const routes = require('shared/plugins/view-licence/routes')

const routePath = '/licences/6e2118b7-fdce-49db-87f1-b2bade7bd8d0/contact'

const testScopes = 'test-scope'

experiment('shared/plugins/view-licence/routes', () => {
  let server

  before(async () => {
    server = await serverFactory.createServer(
      routes(testScopes)
    )
  })

  experiment('licence contact page', () => {
    test('the page should redirect if unauthorised', async () => {
      const request = {
        method: 'GET',
        url: routePath,
        headers: {},
        payload: {}
      }
      // not logged in redirects
      const res = await server.inject(request)
      expect(res.statusCode).to.equal(302)
    })
  })
})
