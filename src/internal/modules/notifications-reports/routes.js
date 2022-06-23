const Joi = require('joi')
const controller = require('./controller')
const preHandlers = require('./lib/pre-handlers')
const { VALID_GUID } = require('shared/lib/validators')
const constants = require('../../lib/constants')
const { allNotifications } = constants.scope

const pageTitle = 'Notification report'

module.exports = {

  getNotificationsList: {
    method: 'GET',
    path: '/notifications/report',
    handler: controller.getNotificationsList,
    config: {
      auth: { scope: allNotifications },
      description: 'View list of notifications sent',
      validate: {
        query: Joi.object().keys({
          page: Joi.number().integer().min(1).default(1),
          form: Joi.string().guid().optional(),
          clear: Joi.number().optional()
        })
      },
      pre: [
        { method: preHandlers.getScheduledNotificationCategories, assign: 'notificationCategories' }
      ],
      plugins: {
        viewContext: {
          pageTitle,
          activeNavLink: 'notifications'
        }
      }
    }
  },

  postNotificationListSearch: {
    method: 'POST',
    path: '/notifications/report',
    handler: controller.postNotificationListSearch,
    config: {
      auth: { scope: allNotifications },
      description: 'Filters notifications',
      pre: [
        { method: preHandlers.getScheduledNotificationCategories, assign: 'notificationCategories' }
      ],
      plugins: {
        viewContext: {
          pageTitle,
          activeNavLink: 'notifications'
        }
      }
    }
  },

  getNotification: {
    method: 'GET',
    path: '/notifications/report/{id}',
    handler: controller.getNotification,
    config: {
      auth: { scope: allNotifications },
      description: 'View list of recipients for a single event',
      validate: {
        params: Joi.object().keys({
          id: VALID_GUID
        }),
        query: Joi.object().keys({
          sort: Joi.string().valid('created', 'notification', 'issuer', 'recipients', 'status').default('created'),
          direction: Joi.number().valid(-1, +1).default(-1)
        })
      },
      plugins: {
        viewContext: {
          pageTitle,
          activeNavLink: 'notifications'
        }
      }
    }
  }
}
