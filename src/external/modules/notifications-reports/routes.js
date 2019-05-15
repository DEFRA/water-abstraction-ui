const Joi = require('joi');
const controller = require('./controller');
const { VALID_GUID } = require('../../lib/validators');

const constants = require('../../lib/constants');
const allAdmin = constants.scope.allAdmin;

module.exports = {

  getNotificationsList: {
    method: 'GET',
    path: '/admin/notifications/report',
    handler: controller.getNotificationsList,
    config: {
      auth: { scope: allAdmin },
      description: 'View list of notifications sent',
      validate: {
        query: {
          sort: Joi.string().valid('created', 'notification', 'issuer', 'recipients', 'status').default('created'),
          direction: Joi.number().valid(-1, +1).default(-1)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Notification report',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  getNotification: {
    method: 'GET',
    path: '/admin/notifications/report/{id}',
    handler: controller.getNotification,
    config: {
      auth: { scope: allAdmin },
      description: 'View list of recipients for a single event',
      validate: {
        params: {
          id: VALID_GUID
        },
        query: {
          sort: Joi.string().valid('created', 'notification', 'issuer', 'recipients', 'status').default('created'),
          direction: Joi.number().valid(-1, +1).default(-1)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Notification report',
          activeNavLink: 'notifications'
        }
      }
    }
  }
};
