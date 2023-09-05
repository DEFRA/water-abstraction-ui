'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const config = require('../../../../src/internal/config.js')

const controller = require('internal/modules/service-status/controller')

experiment('shared/plugins/service-status/controller', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'system').value('http://localhost:8013')
  })

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
      expect(firstCallArgs[0].href).to.equal('http://localhost:8013/health/info')
    })
  })
})
