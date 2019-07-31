const controller = require('./controller');

module.exports = [{
  method: 'GET',
  path: '/service-status',
  handler: controller.getServiceStatus,
  config: {
    description: 'Service Status',
    auth: false,
    plugins: {
      viewContext: {
        pageTitle: 'Service status'
      }
    }
  }
}];
