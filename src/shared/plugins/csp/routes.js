const controller = require('./controller');

module.exports = [
  {
    method: 'POST',
    path: '/csp/report',
    handler: controller.postReport,
    options: {
      auth: false,
      payload: {
        // content-type of request might be application/csp-report
        // meaning that HAPI will not auto parse and will return a 415.
        // So, take over parsing for this route.
        parse: false
      },
      plugins: {
        anonGoogleAnalytics: false
      }
    }
  }
];
