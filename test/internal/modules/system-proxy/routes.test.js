'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { experiment, test, beforeEach } = exports.lab = Lab.script()
const { expect } = Code

// Thing under test
const routes = require('../../../../src/internal/modules/system-proxy/routes')

experiment('system-proxy routes', () => {
  let route

  experiment('/system/{tail*}', () => {
    beforeEach(() => {
      route = _findRoute('GET', '/system/{tail*}')
    })

    test('handles GET requests', () => {
      expect(route.method).to.equal('GET')
    })

    test('does not require authentication', () => {
      expect(route.config.auth).to.equal(false)
    })
  })

  experiment('/assets/all.js', () => {
    beforeEach(() => {
      route = _findRoute('GET', '/assets/all.js')
    })

    test('handles GET requests', () => {
      expect(route.method).to.equal('GET')
    })

    test('does not require authentication', () => {
      expect(route.config.auth).to.equal(false)
    })
  })

  experiment('/assets/stylesheets/application.css', () => {
    beforeEach(() => {
      route = _findRoute('GET', '/assets/stylesheets/application.css')
    })

    test('handles GET requests', () => {
      expect(route.method).to.equal('GET')
    })

    test('does not require authentication', () => {
      expect(route.config.auth).to.equal(false)
    })
  })
})

function _findRoute(method, path) {
  return routes.find((route) => {
    return route.method === method && route.path === path
  })
}
