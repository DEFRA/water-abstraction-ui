'use strict'

const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { scope } = require('internal/lib/constants')
const routes = require('internal/modules/view-licences/routes')
const controller = require('internal/modules/view-licences/controller')

experiment('internal/modules/billing/routes/bills-tab', () => {
  experiment('.getBillsForLicence', () => {
    test('has the right method', () => {
      expect(routes.getBillsForLicence.method).to.equal('GET')
    })
    test('has the right path', () => {
      expect(routes.getBillsForLicence.path).to.equal('/licences/{licenceId}/bills')
    })
    test('has the right controller', () => {
      expect(routes.getBillsForLicence.handler).to.equal(controller.getBillsForLicence)
    })
    test('is available to billing folks', () => {
      expect(routes.getBillsForLicence.config.auth).to.equal({ scope: scope.billing })
    })
  })
})
