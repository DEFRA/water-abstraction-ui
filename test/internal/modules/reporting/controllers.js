'use strict'

const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const controllers = require('internal/modules/reporting/controllers')

experiment('internal/modules/reporting/controllers', () => {
  let request
  let h

  beforeEach(async () => {
    request = {}

    h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getChargingForecastReportsPage', () => {
    beforeEach(async () => {
      await controllers.getChargingForecastReportsPage(request, h)
    })

    test('the page is loaded with the correct nunjucks template', async () => {
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/reporting/charging-forecast-reports')
    })

    test('the page title is correct', async () => {
      const [, { pageTitle }] = h.view.lastCall.args
      expect(pageTitle).to.equal('Download a charging forecast report')
    })

    test('the back link points to /manage', async () => {
      const [, { back }] = h.view.lastCall.args
      expect(back).to.equal('/manage')
    })
  })
})
