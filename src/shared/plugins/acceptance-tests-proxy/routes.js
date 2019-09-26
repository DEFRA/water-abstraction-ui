const controller = require('./controller');

if (process.env.NODE_ENV !== 'production') {
  module.exports = [{
    method: 'POST',
    path: '/acceptance-tests/{tail*}',
    handler: controller.proxyToWaterService,
    config: {
      auth: false,
      description: 'Proxies requests to the water service for acceptance tests'
    }
  }];
}
