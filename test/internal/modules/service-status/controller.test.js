'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const controller = require('internal/modules/service-status/controller')

experiment('shared/plugins/service-status/controller', () => {
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getServiceStatus', () => {
    let request
    let h

    beforeEach(async () => {
      h = {
        redirect: sandbox.stub()
      }
    })

    test('redirects to the the system /health/info page', async () => {
      await controller.getServiceStatus(request, h)

      const firstCallArgs = h.redirect.args[0]

      expect(h.redirect.calledOnce).to.be.true()
      expect(firstCallArgs[0]).to.equal('/system/health/info')
    })
  })
})
