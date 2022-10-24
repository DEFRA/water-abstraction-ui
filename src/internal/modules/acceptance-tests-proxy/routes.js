'use strict'

const controller = require('./controller')

const config = require('../../config')

const routes = []

if (config.featureToggles.acceptanceTestsProxy) {
  routes.push({
    method: 'POST',
    path: '/acceptance-tests/{tail*}',
    handler: controller.postAcceptanceTestsProxy,
    config: {
      auth: false,
      description: 'Proxies requests to the water service for acceptance tests'
    }
  })
}

module.exports = routes
