'use strict'

const hapi = require('@hapi/hapi')
const { expect } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const services = require('external/lib/connectors/services')

const routes = require('external/modules/notifications/routes')

if (process.env.TEST_MODE) {
  let server

  experiment('findLastEmail', () => {
    beforeEach(async () => {
      server = hapi.server()
      server.route(routes.findEmailByAddress)
      sandbox.stub(services.water.notifications, 'getLatestEmailByAddress')
    })

    afterEach(async () => {
      sandbox.restore()
    })

    test('returns a 400 for a missing email', async () => {
      const request = {
        method: 'GET',
        url: '/notifications/last'
      }

      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('returns a 404 if no items are found', async () => {
      services.water.notifications.getLatestEmailByAddress.resolves({
        data: [],
        error: null,
        pagination: { page: 1, perPage: 1, totalRows: 0, pageCount: 0 }
      })

      const request = {
        method: 'GET',
        url: '/notifications/last?email=test'
      }

      const response = await server.inject(request)
      expect(response.statusCode).to.equal(404)
    })

    test('returns a 200 with the expected data', async () => {
      services.water.notifications.getLatestEmailByAddress.resolves({
        data: [{ id: 1 }, { id: 2 }],
        error: null,
        pagination: { page: 1, perPage: 1, totalRows: 2, pageCount: 1 }
      })

      const request = {
        method: 'GET',
        url: '/notifications/last?email=test'
      }

      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
      expect(response.result.data[0].id).to.equal(1)
    })
  })
}
