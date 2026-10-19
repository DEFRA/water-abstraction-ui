'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { experiment, test, beforeEach } = exports.lab = Lab.script()
const { expect } = Code

// Thing under test
const routes = require('../../../../src/internal/modules/system-proxy/routes')

experiment.only('system-proxy routes', () => {
  let route

  experiment('/system/{tail*}', () => {
    experiment('GET requests', () => {
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

    experiment('POST requests', () => {
      beforeEach(() => {
        route = _findRoute('POST', '/system/{tail*}')
      })

      test('handles POST requests', () => {
        expect(route.method).to.equal('POST')
      })

      test('does not require authentication', () => {
        expect(route.config.auth).to.equal(false)
      })
    })
  })

  experiment('/assets/', () => {
    experiment('all.js', () => {
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

    experiment('stylesheets/application.css', () => {
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

    experiment('images/', () => {
      experiment('example-excel-01-min.png', () => {
        beforeEach(() => {
          route = _findRoute('GET', '/assets/images/example-excel-01-min.png')
        })

        test('handles GET requests', () => {
          expect(route.method).to.equal('GET')
        })

        test('does not require authentication', () => {
          expect(route.config.auth).to.equal(false)
        })
      })

      experiment('example-excel-02-min.png', () => {
        beforeEach(() => {
          route = _findRoute('GET', '/assets/images/example-excel-02-min.png')
        })

        test('handles GET requests', () => {
          expect(route.method).to.equal('GET')
        })

        test('does not require authentication', () => {
          expect(route.config.auth).to.equal(false)
        })
      })

      experiment('example-input-01-min.png', () => {
        beforeEach(() => {
          route = _findRoute('GET', '/assets/images/example-input-01-min.png')
        })

        test('handles GET requests', () => {
          expect(route.method).to.equal('GET')
        })

        test('does not require authentication', () => {
          expect(route.config.auth).to.equal(false)
        })
      })
    })
  })
})

function _findRoute(method, path) {
  return routes.find((route) => {
    return route.method === method && route.path === path
  })
}
