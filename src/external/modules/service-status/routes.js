const controller = require('./controller');

module.exports = {
  getServiceStatus: {
    method: 'GET',
    path: '/service-status',
    handler: controller.serviceStatus,
    config: {
      description: 'Service Status',
      auth: false

    }
  }
};
