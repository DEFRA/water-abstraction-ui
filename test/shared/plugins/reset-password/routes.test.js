'use strict'

const Lab = require('@hapi/lab')
const { experiment, test, afterEach, beforeEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')

const serverFactory = require('../../../lib/server-factory')
const routes = require('shared/plugins/reset-password/routes')
const controller = require('shared/plugins/reset-password/controller')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

experiment('shared/plugins/view-licence/routes', () => {
  let server

  beforeEach(() => {
    sandbox.stub(controller, 'getChangePassword').resolves()
    sandbox.stub(controller, 'postChangePassword').resolves()
  })

  afterEach(() => {
    sandbox.restore()
  })

  experiment('reset password change password page', () => {
    const routePath = '/reset_password_change_password'

    const generateRequest = async (query = {}) => {
      const queryString = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
      const request = {
        method: 'GET',
        url: `${routePath}?${queryString}`
      }
      // not logged in redirects
      return server.inject(request)
    }

    beforeEach(async () => {
      server = await serverFactory.createServer(
        routes
      )
    })

    experiment('when reset guid query parameter', () => {
      test('is valid should pass', async () => {
        const res = await generateRequest({ resetGuid: 'dc59f73a-55a5-4adf-943f-36887c714c95' })
        expect(res.statusCode).to.equal(302)
      })

      test('is invalid should fail', async () => {
        const res = await generateRequest({ resetGuid: 'invalid' })
        expect(res.statusCode).to.equal(400)
        expect(res.result.message).to.equal('Invalid request query input')
      })

      test('is missing should fail', async () => {
        const res = await generateRequest()
        expect(res.statusCode).to.equal(400)
        expect(res.result.message).to.equal('Invalid request query input')
      })
    })

    experiment('when forced query parameter', () => {
      test('is valid should pass', async () => {
        const res = await generateRequest({ resetGuid: 'dc59f73a-55a5-4adf-943f-36887c714c95', forced: 1 })
        expect(res.statusCode).to.equal(302)
      })

      test('is invalid should fail', async () => {
        const res = await generateRequest({ resetGuid: 'dc59f73a-55a5-4adf-943f-36887c714c95', forced: 'invalid' })
        expect(res.statusCode).to.equal(400)
        expect(res.result.message).to.equal('Invalid request query input')
      })
    })
  })
})
