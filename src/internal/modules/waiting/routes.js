const Joi = require('@hapi/joi');
const controller = require('./controller');

const { scope } = require('../../lib/constants');

exports.getWaiting = {
  method: 'GET',
  path: '/waiting/{eventId}',
  handler: controller.getWaiting,
  config: {
    auth: {
      scope: scope.internal
    },
    description: 'Generic waiting page for event processing',
    validate: {
      params: {
        eventId: Joi.string().uuid().required()
      }
    },
    plugins: {
      viewContext: {
        activeNavLink: 'notifications'
      }
    }
  }
};
