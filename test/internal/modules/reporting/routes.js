'use strict'

const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()

const { expect } = require('@hapi/code')
const constants = require('internal/lib/constants')
const { billing } = constants.scope
const routes = require('internal/modules/reporting/routes')

lab.experiment('/internal/modules/reporting/routes', () => {
  lab.test('getReport has billing scope', async () => {
    const route = routes.getChargingForecastReportsPage
    expect(route.config.auth.scope).to.equal(billing)
  })
})
