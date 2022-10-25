'use strict'

const controller = require('./controller')

const routes = [
  {
    method: 'POST',
    path: '/acceptance-tests/{tail*}',
    handler: controller.postAcceptanceTestsProxy,
    config: {
      auth: false,
      description: 'Proxies requests to the water service for acceptance tests'
    }
  }
]

module.exports = routes
