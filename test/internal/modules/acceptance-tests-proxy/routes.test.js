'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Things we need to stub
const config = require('../../../../src/internal/config')

// Thing under test
// See note in beforeEach() below!

experiment('acceptance-tests-proxy routes', () => {
  let routes

  beforeEach(() => {
    // Normally, when you first require a module Node will cache it. This aids performance because it avoids
    // re-requiring a module referenced in multiple places. Our problem when it comes to testing is it means whichever
    // test runs first would require our routes and cache it. The second test would then be referencing the cached
    // version so will break. The only way to force node to require the routes module each time is to delete it from
    // the cache between test runs.
    delete require.cache[require.resolve('../../../../src/internal/modules/acceptance-tests-proxy/routes')]
  })
  afterEach(() => {
    sandbox.restore()
  })

  experiment('when the feature toggle is disabled', () => {
    beforeEach(() => {
      sandbox.stub(config.featureToggles, 'acceptanceTestsProxy').value(false)

      // We have to require the routes as part of the test else our stubbing will be ignored.
      routes = require('../../../../src/internal/modules/acceptance-tests-proxy/routes')
    })

    test('routes is empty', () => {
      expect(routes).to.be.empty()
    })
  })

  experiment('when the feature toggle is enabled', () => {
    beforeEach(() => {
      sandbox.stub(config.featureToggles, 'acceptanceTestsProxy').value(true)

      // We have to require the routes as part of the test else our stubbing will be ignored.
      routes = require('../../../../src/internal/modules/acceptance-tests-proxy/routes')
    })

    test('routes is populated', () => {
      expect(routes.length).to.equal(1)
      expect(routes[0].path).to.equal('/acceptance-tests/{tail*}')
    })
  })
})
