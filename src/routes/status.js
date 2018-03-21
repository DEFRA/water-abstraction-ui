const ServiceStatusController = require('../controllers/serviceStatus');

module.exports = [  { method: 'GET',
    path: '/service-status',
    handler: ServiceStatusController.serviceStatus,
    config: {
      description: 'Service Status',
      auth: false

    }}
]
