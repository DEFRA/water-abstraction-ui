const Joi = require('joi');
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
      params: Joi.object().keys({
        eventId: Joi.string().uuid().required()
      }),
      query: Joi.object().keys({
        back: Joi.number().integer().default(1).optional()
      })
    },
    plugins: {
      viewContext: {
        activeNavLink: 'notifications'
      }
    }
  }
};
