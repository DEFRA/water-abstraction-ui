'use strict'

const controller = require('./controller')

const routes = [
  {
    method: 'GET',
    path: '/system/{tail*}',
    handler: controller.getSystemProxy,
    config: {
      auth: false,
      description: 'Proxies requests to the Water Abstraction System'
    }
  },
  {
    method: 'GET',
    path: '/assets/all.js',
    handler: controller.getSystemJsProxy,
    config: {
      auth: false,
      description: 'Proxies JS asset requests to the Water Abstraction System'
    }
  },
  {
    method: 'GET',
    path: '/assets/stylesheets/application.css',
    handler: controller.getSystemCssProxy,
    config: {
      auth: false,
      description: 'Proxies CSS asset requests to the Water Abstraction System'
    }
  }
]

module.exports = routes
