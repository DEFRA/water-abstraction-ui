'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { experiment, test, beforeEach } = exports.lab = Lab.script()
const { expect } = Code

// Thing under test
const routes = require('../../../../src/internal/modules/acceptance-tests-proxy/routes')

experiment('acceptance-tests-proxy routes', () => {
  let route

  experiment('/acceptance-tests', () => {
    beforeEach(() => {
      route = routes[0]
    })

    test('handles POST requests', () => {
      expect(route.method).to.equal('POST')
    })

    test('does not require authentication', () => {
      expect(route.config.auth).to.equal(false)
    })
  })
})
