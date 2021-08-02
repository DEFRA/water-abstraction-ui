const controller = require('./controller');
const constants = require('../../lib/constants');
const Joi = require('joi');
const returns = constants.scope.returns;

module.exports = {

  getReview: {
    method: 'GET',
    path: '/batch-notifications/review/{eventId}',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      validate: {
        params: Joi.object().keys({
          eventId: Joi.string().uuid().required()
        })
      }
    },
    handler: controller.getReview
  },

  getRecipientsCSV: {
    method: 'GET',
    path: '/batch-notifications/csv/{eventId}',
    config: {
      auth: {
        scope: returns
      },
      validate: {
        params: Joi.object().keys({
          eventId: Joi.string().uuid().required()
        })
      }
    },
    handler: controller.getRecipientsCSV
  },

  postSendNotification: {
    method: 'POST',
    path: '/batch-notifications/send/{eventId}',
    config: {
      auth: {
        scope: returns
      },
      validate: {
        params: Joi.object().keys({
          eventId: Joi.string().uuid().required()
        }),
        payload: Joi.object().keys({
          csrf_token: Joi.string().uuid().required()
        })
      }
    },
    handler: controller.postSendNotification
  },

  getConfirmation: {
    method: 'GET',
    path: '/batch-notifications/confirmation/{eventId}',
    config: {
      auth: {
        scope: returns
      },
      validate: {
        params: Joi.object().keys({
          eventId: Joi.string().uuid().required()
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Notification sent'
        }
      }
    },
    handler: controller.getConfirmation
  }
};
