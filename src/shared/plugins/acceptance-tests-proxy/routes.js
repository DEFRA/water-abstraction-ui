'use strict'

const controller = require('./controller')

const routes = []

if (process.env.ENVIRONMENT !== 'prd') {
  routes.push({
    method: 'POST',
    path: '/acceptance-tests/{tail*}',
    handler: controller.proxyToWaterService,
    config: {
      auth: false,
      description: 'Proxies requests to the water service for acceptance tests'
    }
  })
}

module.exports = routes
