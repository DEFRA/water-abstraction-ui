const controller = require('./controller');

const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);

const routes = [];

if (isAcceptanceTestTarget) {
  routes.push({
    method: 'POST',
    path: '/acceptance-tests/{tail*}',
    handler: controller.proxyToWaterService,
    config: {
      auth: false,
      description: 'Proxies requests to the water service for acceptance tests'
    }
  });
}

module.exports = routes;
